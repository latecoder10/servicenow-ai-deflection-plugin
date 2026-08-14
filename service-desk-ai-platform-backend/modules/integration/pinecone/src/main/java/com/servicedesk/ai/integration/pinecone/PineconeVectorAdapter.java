package com.servicedesk.ai.integration.pinecone;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.common.model.CorrelationContext;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.DocumentSourceType;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.integration.pinecone.config.PineconeConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class PineconeVectorAdapter implements VectorDatabasePort {

    private final PineconeIndexResolver indexResolver;
    private final PineconeConfig pineconeConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Form values that mean "unset" and must never become a metadata filter. */
    private static final Set<String> UNFILTERABLE =
        Set.of("", "none", "-- none --", "all", "all categories", "all workspaces", "null", "undefined");

    private static String text(JsonNode meta, String field) {
        return meta.has(field) ? meta.path(field).asText(null) : null;
    }

    private static void putIfPresent(Map<String, String> target, JsonNode meta, String field) {
        putIfSet(target, field, text(meta, field));
    }

    private static void putIfSet(Map<String, String> target, String key, String value) {
        if (key != null && value != null && !value.isBlank()) {
            target.put(key, value);
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    /**
     * The indexed source type. An unrecognised value is dropped rather than thrown:
     * a vector written by a connector this build no longer knows about is still a
     * perfectly good search result.
     */
    private static DocumentSourceType sourceType(JsonNode meta) {
        String raw = text(meta, AppConstants.META_SOURCE_TYPE);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return DocumentSourceType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.debug("[Pinecone] Unrecognised sourceType '{}' in vector metadata", raw);
            return null;
        }
    }

    private static Instant instant(JsonNode meta, String field) {
        String raw = text(meta, field);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(raw);
        } catch (DateTimeParseException e) {
            log.debug("[Pinecone] Unparseable {} '{}' in vector metadata", field, raw);
            return null;
        }
    }

    /** Tags round-trip as one delimited string, since Pinecone metadata values are scalars. */
    private static Set<String> tags(JsonNode meta) {
        String raw = text(meta, AppConstants.META_TAGS);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        Set<String> parsed = new LinkedHashSet<>();
        for (String tag : raw.split(AppConstants.META_TAG_SEPARATOR)) {
            if (!tag.isBlank()) {
                parsed.add(tag.trim());
            }
        }
        return parsed.isEmpty() ? null : parsed;
    }

    private static int intOrZero(JsonNode meta, String field) {
        String raw = text(meta, field);
        if (raw == null || raw.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static boolean isFilterable(String value) {
        return value != null && !UNFILTERABLE.contains(value.trim().toLowerCase());
    }

    /**
     * Builds a Pinecone metadata filter from the caller's department and category.
     * Both are optional; an empty map means an unfiltered query.
     */
    private Map<String, Object> buildFilter(String departmentFilter, String categoryFilter) {
        return buildFilter(departmentFilter, categoryFilter, Set.of());
    }

    private Map<String, Object> buildFilter(String departmentFilter, String categoryFilter,
                                            Set<String> excludedConnectorTypes) {
        Map<String, Object> filter = new LinkedHashMap<>();
        if (isFilterable(departmentFilter)) {
            filter.put(AppConstants.META_DEPARTMENT, Map.of("$eq", departmentFilter.trim()));
        }
        if (isFilterable(categoryFilter)) {
            filter.put(AppConstants.META_CATEGORY, Map.of("$eq", categoryFilter.trim()));
        }
        if (excludedConnectorTypes != null && !excludedConnectorTypes.isEmpty()) {
            // Verified against the live index: $nin still matches vectors that carry no
            // connectorType at all, so records indexed before provenance was written are
            // kept rather than silently dropped when a source is switched off.
            filter.put(AppConstants.META_CONNECTOR_TYPE, Map.of("$nin", List.copyOf(excludedConnectorTypes)));
        }
        return filter;
    }

    /**
     * Namespaces that actually hold vectors, cached because the list changes only when a
     * sync writes into a new date window.
     */
    private volatile List<String> cachedNamespaces = List.of();
    private volatile long namespacesCachedAt = 0L;
    private static final long NAMESPACE_TTL_MS = 300_000;

    private List<String> populatedNamespaces(String host) {
        long now = System.currentTimeMillis();
        if (!cachedNamespaces.isEmpty() && now - namespacesCachedAt < NAMESPACE_TTL_MS) {
            return cachedNamespaces;
        }

        List<String> found = new ArrayList<>();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

            ResponseEntity<String> response = new RestTemplate().exchange(
                "https://" + host + "/describe_index_stats", HttpMethod.POST,
                new HttpEntity<>("{}", headers), String.class);

            JsonNode namespaces = objectMapper.readTree(response.getBody()).path("namespaces");
            namespaces.fieldNames().forEachRemaining(name -> {
                if (namespaces.path(name).path("vectorCount").asLong(0) > 0) {
                    found.add(name);
                }
            });
        } catch (Exception e) {
            log.warn("[Pinecone] Could not list namespaces ({}), falling back to the current window",
                e.getMessage());
        }

        if (found.isEmpty()) {
            found.add(indexResolver.resolveCurrentNamespace());
        }
        cachedNamespaces = List.copyOf(found);
        namespacesCachedAt = now;
        return cachedNamespaces;
    }

    /**
     * Queries every namespace and pools the matches. Each namespace is asked for the full
     * topK because the best answers may all sit in one of them.
     */
    private List<JsonNode> queryAllNamespaces(String host, List<String> namespaces, List<Float> queryVector,
                                              int topK, Map<String, Object> filter) {
        List<JsonNode> pooled = java.util.Collections.synchronizedList(new ArrayList<>());

        namespaces.parallelStream().forEach(ns -> {
            try {
                for (JsonNode match : executeQuery(host, ns, queryVector, topK, filter)) {
                    pooled.add(match);
                }
            } catch (Exception e) {
                // One unreachable namespace must not lose the results from the others.
                log.warn("[Pinecone] Query failed for namespace '{}': {}", ns, e.getMessage());
            }
        });
        return new ArrayList<>(pooled);
    }

    private JsonNode executeQuery(String host, String namespace, List<Float> queryVector,
                                  int topK, Map<String, Object> filter) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("vector", queryVector);
        body.put("topK", topK);
        body.put("namespace", namespace);
        body.put("includeMetadata", true);
        if (!filter.isEmpty()) {
            body.put("filter", filter);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

        String url = "https://" + host + AppConstants.PINECONE_QUERY_PATH;
        HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

        ResponseEntity<String> response = new RestTemplate().exchange(url, HttpMethod.POST, request, String.class);
        return objectMapper.readTree(response.getBody()).path("matches");
    }

    @Override
    public int upsertChunks(String collectionName, List<KnowledgeChunk> chunks) {
        if (chunks.isEmpty()) return 0;

        Instant docDate = chunks.get(0).getMetadata() != null && chunks.get(0).getMetadata().createdDate() != null
            ? chunks.get(0).getMetadata().createdDate() : Instant.now();
        Instant indexedAt = Instant.now();
        String namespace = indexResolver.resolveNamespace(docDate);
        String host = pineconeConfig.getHost();

        if (host == null || host.isBlank()) {
            log.warn("Pinecone host not configured, skipping upsert of {} vectors", chunks.size());
            return 0;
        }

        int totalUpserted = 0;
        int totalBatches = (chunks.size() + AppConstants.PINECONE_BATCH_SIZE - 1) / AppConstants.PINECONE_BATCH_SIZE;

        for (int batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            int start = batchIndex * AppConstants.PINECONE_BATCH_SIZE;
            int end = Math.min(start + AppConstants.PINECONE_BATCH_SIZE, chunks.size());
            List<KnowledgeChunk> batch = chunks.subList(start, end);

            List<Map<String, Object>> vectors = new ArrayList<>();
            for (KnowledgeChunk chunk : batch) {
                Map<String, Object> vector = new LinkedHashMap<>();
                vector.put("id", chunk.getDocumentId() + "-" + chunk.getChunkIndex());
                if (chunk.getVectorEmbedding() != null && !chunk.getVectorEmbedding().isEmpty()) {
                    vector.put("values", chunk.getVectorEmbedding());
                }
                
                Map<String, String> metadata = new LinkedHashMap<>();
                if (chunk.getTextContent() != null) {
                    metadata.put(AppConstants.META_TEXT, chunk.getTextContent());
                }
                metadata.put(AppConstants.META_DOCUMENT_ID, chunk.getDocumentId());
                metadata.put(AppConstants.META_CHUNK_INDEX, String.valueOf(chunk.getChunkIndex()));
                putIfSet(metadata, AppConstants.META_HEADER_HIERARCHY, chunk.getHeaderHierarchy());
                if (chunk.getTokenCount() > 0) {
                    metadata.put(AppConstants.META_TOKEN_COUNT, String.valueOf(chunk.getTokenCount()));
                }

                DocumentMetadata doc = chunk.getMetadata();
                if (doc != null) {
                    // Blank-guarded throughout. An empty value written here is worse than
                    // an absent one: $eq never matches "", so an empty department made
                    // every department-filtered query fall through to the unfiltered
                    // retry below and quietly return the wrong scope.
                    putIfSet(metadata, AppConstants.META_TITLE, doc.title());
                    putIfSet(metadata, AppConstants.META_DEPARTMENT, doc.department());
                    putIfSet(metadata, AppConstants.META_CATEGORY, doc.category());
                    // Document-level fields the model has always carried but the upsert
                    // dropped, which is why every search result returned them as null.
                    putIfSet(metadata, AppConstants.META_SOURCE_URI, doc.sourceUri());
                    putIfSet(metadata, AppConstants.META_OWNER_EMAIL, doc.ownerEmail());
                    putIfSet(metadata, AppConstants.META_VERSION, doc.version());
                    if (doc.sourceType() != null) {
                        metadata.put(AppConstants.META_SOURCE_TYPE, doc.sourceType().name());
                    }
                    if (doc.tags() != null && !doc.tags().isEmpty()) {
                        metadata.put(AppConstants.META_TAGS,
                            String.join(AppConstants.META_TAG_SEPARATOR, doc.tags()));
                    }
                    if (doc.createdDate() != null) {
                        metadata.put(AppConstants.META_CREATED_DATE, doc.createdDate().toString());
                    }
                    // Stamped here rather than taken from the caller, so it records when
                    // the vector was actually written rather than when it was built.
                    metadata.put(AppConstants.META_LAST_INDEXED_DATE, indexedAt.toString());
                    // Source provenance (record number, sys_id, type, priority, year).
                    // Without this a retrieved chunk cannot be cited back to its record.
                    if (doc.customAttributes() != null) {
                        doc.customAttributes().forEach((k, v) -> putIfSet(metadata, k, v));
                    }
                }
                vector.put("metadata", metadata);
                vectors.add(vector);
            }

            boolean success = upsertBatchWithRetry(host, namespace, vectors, batchIndex + 1, totalBatches);
            if (success) {
                totalUpserted += batch.size();
            } else {
                log.error("Batch {} failed after {} retries, stopping upsert", batchIndex + 1, AppConstants.PINECONE_MAX_RETRIES);
                break;
            }
        }

        log.info("Pinecone upsert complete: {}/{} vectors to namespace='{}'", totalUpserted, chunks.size(), namespace);
        return totalUpserted;
    }

    @Override
    public int upsertVectors(String collectionName, List<VectorEntry> entries) {
        if (entries.isEmpty()) return 0;

        String namespace = indexResolver.resolveCurrentNamespace();
        String host = pineconeConfig.getHost();

        if (host == null || host.isBlank()) {
            log.warn("Pinecone host not configured, skipping upsert of {} vectors", entries.size());
            return 0;
        }

        int totalUpserted = 0;
        int totalBatches = (entries.size() + AppConstants.PINECONE_BATCH_SIZE - 1) / AppConstants.PINECONE_BATCH_SIZE;

        for (int batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            int start = batchIndex * AppConstants.PINECONE_BATCH_SIZE;
            int end = Math.min(start + AppConstants.PINECONE_BATCH_SIZE, entries.size());
            List<VectorEntry> batch = entries.subList(start, end);

            List<Map<String, Object>> vectors = new ArrayList<>();
            for (VectorEntry entry : batch) {
                Map<String, Object> vector = new LinkedHashMap<>();
                vector.put("id", entry.id());
                if (entry.embedding() != null && !entry.embedding().isEmpty()) {
                    vector.put("values", entry.embedding());
                }
                if (entry.metadata() != null) {
                    vector.put("metadata", entry.metadata());
                }
                vectors.add(vector);
            }

            boolean success = upsertBatchWithRetry(host, namespace, vectors, batchIndex + 1, totalBatches);
            if (success) {
                totalUpserted += batch.size();
            } else {
                log.error("Batch {} failed after {} retries, stopping upsert", batchIndex + 1, AppConstants.PINECONE_MAX_RETRIES);
                break;
            }
        }

        log.info("Pinecone upsertVectors complete: {}/{} vectors to namespace='{}'", totalUpserted, entries.size(), namespace);
        return totalUpserted;
    }

    private boolean upsertBatchWithRetry(String host, String namespace, List<Map<String, Object>> vectors, int batchNum, int totalBatches) {
        long backoff = AppConstants.PINECONE_INITIAL_BACKOFF_MS;

        for (int attempt = 1; attempt <= AppConstants.PINECONE_MAX_RETRIES; attempt++) {
            try {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("vectors", vectors);
                body.put("namespace", namespace);

                RestTemplate rest = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

                String url = "https://" + host + AppConstants.PINECONE_UPSERT_PATH;
                HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

                ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Batch {}/{}: upserted {} vectors (attempt {})", batchNum, totalBatches, vectors.size(), attempt);
                    return true;
                }

                log.warn("Batch {}/{}: unexpected status {} (attempt {})", batchNum, totalBatches, response.getStatusCode(), attempt);
            } catch (Exception e) {
                log.warn("Batch {}/{}: attempt {} failed: {}", batchNum, totalBatches, attempt, e.getMessage());
            }

                if (attempt < AppConstants.PINECONE_MAX_RETRIES) {
                try {
                    Thread.sleep(backoff);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return false;
                }
                backoff *= 2;
            }
        }
        return false;
    }

    @Override
    public void upsertVector(String vectorId, List<Float> embedding, Map<String, Object> metadata, String text) {
        String host = pineconeConfig.getHost();
        if (host == null || host.isBlank()) {
            log.warn("Pinecone host not configured, skipping upsert for {}", vectorId);
            return;
        }

        String namespace = indexResolver.resolveCurrentNamespace();

        try {
            Map<String, Object> vector = new LinkedHashMap<>();
            vector.put("id", vectorId);
            if (embedding != null && !embedding.isEmpty()) {
                vector.put("values", embedding);
            }
            
            Map<String, Object> metaMap = new LinkedHashMap<>();
            if (metadata != null) {
                metaMap.putAll(metadata);
            }
            if (text != null) {
                metaMap.put(AppConstants.META_TEXT, text);
            }
            vector.put("metadata", metaMap);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("vectors", List.of(vector));
            body.put("namespace", namespace);

            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

            String url = "https://" + host + AppConstants.PINECONE_UPSERT_PATH;
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);
            log.debug("Pinecone upsertVector: id='{}', status={}", vectorId, response.getStatusCode());
        } catch (Exception e) {
            log.error("Pinecone upsertVector failed for '{}': {}", vectorId, e.getMessage(), e);
        }
    }

    @Override
    public List<KnowledgeChunk> similaritySearch(String collectionName, List<Float> queryVector, int topK,
                                                 String departmentFilter, String categoryFilter) {
        return similaritySearch(collectionName, queryVector, topK, departmentFilter, categoryFilter, Set.of());
    }

    @Override
    public List<KnowledgeChunk> similaritySearch(String collectionName, List<Float> queryVector, int topK,
                                                 String departmentFilter, String categoryFilter,
                                                 Set<String> excludedConnectorTypes) {
        String cid = CorrelationContext.getCorrelationId();
        String host = pineconeConfig.getHost();

        if (host == null || host.isBlank()) {
            log.warn("[Pinecone][{}] Host not configured, returning empty results", cid);
            return List.of();
        }

        try {
            Map<String, Object> filter = buildFilter(departmentFilter, categoryFilter, excludedConnectorTypes);

            // Vectors are written to a namespace derived from the document's own date, so
            // searching only the current window would hide every older record. Every
            // populated namespace is queried and the results merged.
            List<String> namespaces = populatedNamespaces(host);

            long start = System.currentTimeMillis();
            List<JsonNode> matches = queryAllNamespaces(host, namespaces, queryVector, topK, filter);

            // A department or category filter that matches nothing is worse than no
            // filter: the agent gets an empty panel instead of a slightly less targeted
            // answer. An excluded source is different - the agent asked for it to be left
            // out, so that exclusion is kept on the retry.
            if (!filter.isEmpty() && matches.isEmpty()) {
                Map<String, Object> sourceOnly = buildFilter(null, null, excludedConnectorTypes);
                log.info("[Pinecone][{}] Filter {} matched nothing, retrying with {}",
                    cid, filter.keySet(), sourceOnly.isEmpty() ? "no filter" : sourceOnly.keySet());
                matches = queryAllNamespaces(host, namespaces, queryVector, topK, sourceOnly);
            }
            long apiTime = System.currentTimeMillis() - start;

            // Merged from several namespaces, so re-sort globally and trim to topK.
            matches.sort((a, b) -> Double.compare(b.path("score").asDouble(), a.path("score").asDouble()));
            if (matches.size() > topK) {
                matches = matches.subList(0, topK);
            }

            List<KnowledgeChunk> results = new ArrayList<>();
            for (var match : matches) {
                var meta = match.path("metadata");
                // Source provenance rides in customAttributes rather than as new
                // record components, so citing a suggestion needs no domain change.
                Map<String, String> provenance = new LinkedHashMap<>();
                putIfPresent(provenance, meta, AppConstants.META_RECORD_NUMBER);
                putIfPresent(provenance, meta, AppConstants.META_RECORD_SYS_ID);
                putIfPresent(provenance, meta, AppConstants.META_RECORD_TYPE);
                putIfPresent(provenance, meta, AppConstants.META_PRIORITY);
                putIfPresent(provenance, meta, AppConstants.META_YEAR);
                // Which system the record came from. Drives the source badge in the
                // sidebar and decides whether a citation links to ServiceNow or Drive.
                putIfPresent(provenance, meta, AppConstants.META_CONNECTOR_TYPE);
                putIfPresent(provenance, meta, AppConstants.META_WORKSPACE);
                putIfPresent(provenance, meta, AppConstants.META_SOURCE_URL);

                DocumentMetadata docMeta = DocumentMetadata.builder()
                    .documentId(meta.path(AppConstants.META_DOCUMENT_ID).asText(""))
                    .title(text(meta, AppConstants.META_TITLE))
                    .department(text(meta, AppConstants.META_DEPARTMENT))
                    .category(text(meta, AppConstants.META_CATEGORY))
                    .sourceType(sourceType(meta))
                    // sourceUrl is the fallback, not the primary: vectors indexed before
                    // sourceUri was written carry only that older key.
                    .sourceUri(firstNonBlank(text(meta, AppConstants.META_SOURCE_URI),
                                             text(meta, AppConstants.META_SOURCE_URL)))
                    .ownerEmail(text(meta, AppConstants.META_OWNER_EMAIL))
                    .version(text(meta, AppConstants.META_VERSION))
                    .tags(tags(meta))
                    .createdDate(instant(meta, AppConstants.META_CREATED_DATE))
                    .lastIndexedDate(instant(meta, AppConstants.META_LAST_INDEXED_DATE))
                    .customAttributes(provenance)
                    .build();

                KnowledgeChunk chunk = KnowledgeChunk.builder()
                    .chunkId(match.path("id").asText())
                    .documentId(meta.path(AppConstants.META_DOCUMENT_ID).asText(""))
                    .chunkIndex(intOrZero(meta, AppConstants.META_CHUNK_INDEX))
                    .textContent(text(meta, AppConstants.META_TEXT))
                    .headerHierarchy(text(meta, AppConstants.META_HEADER_HIERARCHY))
                    .tokenCount(intOrZero(meta, AppConstants.META_TOKEN_COUNT))
                    .metadata(docMeta)
                    .relevanceScore(match.path("score").asDouble())
                    .build();
                results.add(chunk);
            }
            log.info("[Pinecone][{}] Query responded in {}ms: {} results across {} namespace(s) {}",
                cid, apiTime, results.size(), namespaces.size(), namespaces);
            return results;
        } catch (Exception e) {
            log.error("[Pinecone][{}] Search failed: {}", cid, e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    public void deleteByDocumentId(String collectionName, String documentId) {
        String host = pineconeConfig.getHost();
        if (host == null || host.isBlank()) return;

        // A document lives in the namespace derived from its own date, which is not
        // necessarily the current window, so every namespace has to be swept. Deleting
        // from one would leave the rest behind to resurface in search.
        for (String namespace : populatedNamespaces(host)) {
            try {
                Map<String, Object> body = Map.of(
                    "filter", Map.of(AppConstants.META_DOCUMENT_ID, Map.of("$eq", documentId)),
                    "namespace", namespace
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

                String url = "https://" + host + AppConstants.PINECONE_DELETE_PATH;
                HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
                new RestTemplate().exchange(url, HttpMethod.POST, request, String.class);
                log.debug("Deleted vectors for documentId='{}' from namespace='{}'", documentId, namespace);
            } catch (Exception e) {
                log.error("Pinecone delete failed for namespace '{}': {}", namespace, e.getMessage());
            }
        }
        log.info("Deleted vectors for documentId='{}'", documentId);
    }

    @Override
    public void deleteVector(String vectorId) {
        String host = pineconeConfig.getHost();
        if (host == null || host.isBlank()) return;

        try {
            String namespace = indexResolver.resolveCurrentNamespace();
            Map<String, Object> body = Map.of(
                "ids", List.of(vectorId),
                "namespace", namespace
            );

            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

            String url = "https://" + host + AppConstants.PINECONE_DELETE_PATH;
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            rest.exchange(url, HttpMethod.POST, request, String.class);
            log.info("Deleted vector '{}' from namespace='{}'", vectorId, namespace);
        } catch (Exception e) {
            log.error("Pinecone deleteVector failed for '{}': {}", vectorId, e.getMessage());
        }
    }

    @Override
    public long countVectors(String collectionName) {
        String host = pineconeConfig.getHost();
        if (host == null || host.isBlank()) {
            return 0L;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

            // describe_index_stats is a POST endpoint. Issued as a GET it fails, and the
            // catch below turned that into a reported count of zero.
            ResponseEntity<String> response = new RestTemplate().exchange(
                "https://" + host + "/describe_index_stats", HttpMethod.POST,
                new HttpEntity<>("{}", headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            // The whole index, not just the current date window. Counting one namespace
            // under-reported the corpus by however much history had been synced.
            long total = root.path("totalVectorCount").asLong(-1L);
            if (total >= 0) {
                return total;
            }

            long summed = 0L;
            JsonNode namespaces = root.path("namespaces");
            for (JsonNode ns : namespaces) {
                summed += ns.path("vectorCount").asLong(0L);
            }
            return summed;
        } catch (Exception e) {
            log.warn("Pinecone countVectors failed: {}", e.getMessage());
            return 0L;
        }
    }
}
