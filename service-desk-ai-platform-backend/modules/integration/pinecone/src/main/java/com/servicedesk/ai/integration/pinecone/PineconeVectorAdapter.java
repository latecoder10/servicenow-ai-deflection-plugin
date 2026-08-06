package com.servicedesk.ai.integration.pinecone;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.integration.pinecone.config.PineconeConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class PineconeVectorAdapter implements VectorDatabasePort {

    private final PineconeIndexResolver indexResolver;
    private final PineconeConfig pineconeConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public int upsertChunks(String collectionName, List<KnowledgeChunk> chunks) {
        if (chunks.isEmpty()) return 0;

        Instant docDate = chunks.get(0).getMetadata() != null && chunks.get(0).getMetadata().createdDate() != null
            ? chunks.get(0).getMetadata().createdDate() : Instant.now();
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
                if (chunk.getMetadata() != null) {
                    if (chunk.getMetadata().title() != null) metadata.put(AppConstants.META_TITLE, chunk.getMetadata().title());
                    if (chunk.getMetadata().department() != null) metadata.put(AppConstants.META_DEPARTMENT, chunk.getMetadata().department());
                    if (chunk.getMetadata().category() != null) metadata.put(AppConstants.META_CATEGORY, chunk.getMetadata().category());
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
    public List<KnowledgeChunk> similaritySearch(String collectionName, List<Float> queryVector, int topK, String departmentFilter, String categoryFilter) {
        String namespace = indexResolver.resolveCurrentNamespace();
        String host = pineconeConfig.getHost();

        if (host == null || host.isBlank()) {
            log.warn("Pinecone host not configured, returning empty results");
            return List.of();
        }

        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("vector", queryVector);
            body.put("topK", topK);
            body.put("namespace", namespace);
            body.put("includeMetadata", true);

            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

            String url = "https://" + host + AppConstants.PINECONE_QUERY_PATH;
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);
            var root = objectMapper.readTree(response.getBody());
            var matches = root.path("matches");

            List<KnowledgeChunk> results = new ArrayList<>();
            for (var match : matches) {
                var meta = match.path("metadata");
                DocumentMetadata docMeta = DocumentMetadata.builder()
                    .documentId(meta.path("documentId").asText(""))
                    .title(meta.has("title") ? meta.path("title").asText(null) : null)
                    .department(meta.has("department") ? meta.path("department").asText(null) : null)
                    .category(meta.has("category") ? meta.path("category").asText(null) : null)
                    .build();

                KnowledgeChunk chunk = KnowledgeChunk.builder()
                    .chunkId(match.path("id").asText())
                    .documentId(meta.path("documentId").asText(""))
                    .chunkIndex(meta.has("chunkIndex") ? meta.path("chunkIndex").asInt() : 0)
                    .textContent(meta.has("text") ? meta.path("text").asText(null) : null)
                    .metadata(docMeta)
                    .relevanceScore(match.path("score").asDouble())
                    .build();
                results.add(chunk);
            }
            return results;
        } catch (Exception e) {
            log.error("Pinecone search failed: {}", e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    public void deleteByDocumentId(String collectionName, String documentId) {
        String host = pineconeConfig.getHost();
        if (host == null || host.isBlank()) return;

        try {
            String namespace = indexResolver.resolveCurrentNamespace();
            Map<String, Object> body = Map.of(
                "filter", Map.of(AppConstants.META_DOCUMENT_ID, Map.of("$eq", documentId)),
                "namespace", namespace
            );

            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(AppConstants.PINECONE_API_KEY_HEADER, pineconeConfig.getApiKey());

            String url = "https://" + host + AppConstants.PINECONE_DELETE_PATH;
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            rest.exchange(url, HttpMethod.POST, request, String.class);
            log.info("Deleted vectors for documentId='{}' from namespace='{}'", documentId, namespace);
        } catch (Exception e) {
            log.error("Pinecone delete failed: {}", e.getMessage(), e);
        }
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
        return 0L;
    }
}
