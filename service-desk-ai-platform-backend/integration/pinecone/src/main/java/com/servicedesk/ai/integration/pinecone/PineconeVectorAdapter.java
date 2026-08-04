package com.servicedesk.ai.integration.pinecone;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final int BATCH_SIZE = 96;
    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_BACKOFF_MS = 1000;

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
        int totalBatches = (chunks.size() + BATCH_SIZE - 1) / BATCH_SIZE;

        for (int batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            int start = batchIndex * BATCH_SIZE;
            int end = Math.min(start + BATCH_SIZE, chunks.size());
            List<KnowledgeChunk> batch = chunks.subList(start, end);

            List<Map<String, Object>> vectors = new ArrayList<>();
            for (KnowledgeChunk chunk : batch) {
                Map<String, Object> vector = new LinkedHashMap<>();
                vector.put("id", chunk.getDocumentId() + "-" + chunk.getChunkIndex());
                vector.put("text", chunk.getTextContent());
                Map<String, String> metadata = new LinkedHashMap<>();
                metadata.put("documentId", chunk.getDocumentId());
                metadata.put("chunkIndex", String.valueOf(chunk.getChunkIndex()));
                if (chunk.getMetadata() != null) {
                    if (chunk.getMetadata().title() != null) metadata.put("title", chunk.getMetadata().title());
                    if (chunk.getMetadata().department() != null) metadata.put("department", chunk.getMetadata().department());
                    if (chunk.getMetadata().category() != null) metadata.put("category", chunk.getMetadata().category());
                }
                vector.put("metadata", metadata);
                vectors.add(vector);
            }

            boolean success = upsertBatchWithRetry(host, namespace, vectors, batchIndex + 1, totalBatches);
            if (success) {
                totalUpserted += batch.size();
            } else {
                log.error("Batch {} failed after {} retries, stopping upsert", batchIndex + 1, MAX_RETRIES);
                break;
            }
        }

        log.info("Pinecone upsert complete: {}/{} vectors to namespace='{}'", totalUpserted, chunks.size(), namespace);
        return totalUpserted;
    }

    private boolean upsertBatchWithRetry(String host, String namespace, List<Map<String, Object>> vectors, int batchNum, int totalBatches) {
        long backoff = INITIAL_BACKOFF_MS;

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("vectors", vectors);
                body.put("namespace", namespace);

                RestTemplate rest = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Api-Key", pineconeConfig.getApiKey());

                String url = "https://" + host + "/vectors/upsert";
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

            if (attempt < MAX_RETRIES) {
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
            headers.set("Api-Key", pineconeConfig.getApiKey());

            String url = "https://" + host + "/query";
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);
            var root = objectMapper.readTree(response.getBody());
            var matches = root.path("matches");

            List<KnowledgeChunk> results = new ArrayList<>();
            for (var match : matches) {
                var meta = match.path("metadata");
                KnowledgeChunk chunk = KnowledgeChunk.builder()
                    .chunkId(match.path("id").asText())
                    .documentId(meta.path("documentId").asText(""))
                    .chunkIndex(meta.has("chunkIndex") ? meta.path("chunkIndex").asInt() : 0)
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
                "filter", Map.of("documentId", Map.of("$eq", documentId)),
                "namespace", namespace
            );

            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Api-Key", pineconeConfig.getApiKey());

            String url = "https://" + host + "/vectors/delete";
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            rest.exchange(url, HttpMethod.POST, request, String.class);
            log.info("Deleted vectors for documentId='{}' from namespace='{}'", documentId, namespace);
        } catch (Exception e) {
            log.error("Pinecone delete failed: {}", e.getMessage(), e);
        }
    }

    @Override
    public long countVectors(String collectionName) {
        return 0L;
    }
}
