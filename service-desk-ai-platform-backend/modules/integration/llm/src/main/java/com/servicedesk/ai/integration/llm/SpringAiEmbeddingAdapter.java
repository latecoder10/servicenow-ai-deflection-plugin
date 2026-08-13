package com.servicedesk.ai.integration.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.common.model.CorrelationContext;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.integration.llm.config.EmbeddingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class SpringAiEmbeddingAdapter implements EmbeddingPort {

    private final EmbeddingConfig embeddingConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.llm.api-key:}")
    private String apiKey;

    @Override
    public List<Float> generateEmbedding(String textContent) {
        String cid = CorrelationContext.getCorrelationId();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key (ai.llm.api-key or GEMINI_API_KEY) is not configured.");
        }
        try {
            RestTemplate rest = new RestTemplate();
            String modelToUse = AppConstants.EMBEDDING_MODEL;
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + modelToUse + ":embedContent?key=" + apiKey;

            Map<String, Object> body = Map.of(
                "model", "models/" + modelToUse,
                "content", Map.of("parts", List.of(Map.of("text", truncate(textContent, AppConstants.EMBEDDING_MAX_TEXT_LENGTH))))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            long start = System.currentTimeMillis();
            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);
            long apiTime = System.currentTimeMillis() - start;

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode values = root.path("embedding").path("values");

            List<Float> vector = new ArrayList<>();
            values.forEach(v -> vector.add(v.floatValue()));

            int targetDim = embeddingConfig.getDimension();
            while (vector.size() < targetDim) {
                vector.add(0.0f);
            }
            if (vector.size() > targetDim) {
                vector.subList(targetDim, vector.size()).clear();
            }

            log.info("[Embedding][{}] Gemini API responded in {}ms: {}-dim vector for text ({} chars)",
                cid, apiTime, vector.size(), textContent.length());
            return vector;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Gemini embedding API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public List<List<Float>> generateBatchEmbeddings(List<String> textBatch) {
        if (textBatch.isEmpty()) return List.of();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key (ai.llm.api-key or GEMINI_API_KEY) is not configured. "
                + "Set the environment variable or application property to enable real embeddings.");
        }

        int batchSize = AppConstants.EMBEDDING_BATCH_SIZE;
        List<List<Float>> allEmbeddings = new ArrayList<>();

        for (int i = 0; i < textBatch.size(); i += batchSize) {
            List<String> chunk = textBatch.subList(i, Math.min(i + batchSize, textBatch.size()));
            allEmbeddings.addAll(batchEmbed(chunk));
        }

        log.info("Batch generated {} embeddings for {} texts", allEmbeddings.size(), textBatch.size());
        return allEmbeddings;
    }

    private List<List<Float>> batchEmbed(List<String> texts) {
        String cid = CorrelationContext.getCorrelationId();
        try {
            String modelToUse = AppConstants.EMBEDDING_MODEL;
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + modelToUse + ":batchEmbedContents?key=" + apiKey;

            List<Map<String, Object>> requests = texts.stream()
                .map(text -> Map.of(
                    "model", "models/" + modelToUse,
                    "content", Map.of("parts", List.of(Map.of("text", truncate(text, AppConstants.EMBEDDING_MAX_TEXT_LENGTH))))
                ))
                .toList();

            Map<String, Object> body = Map.of("requests", requests);

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            long start = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            long apiTime = System.currentTimeMillis() - start;

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode embeddings = root.path("embeddings");

            int targetDim = embeddingConfig.getDimension();
            List<List<Float>> results = new ArrayList<>();
            for (JsonNode emb : embeddings) {
                List<Float> vector = new ArrayList<>();
                emb.path("values").forEach(v -> vector.add(v.floatValue()));
                while (vector.size() < targetDim) vector.add(0.0f);
                if (vector.size() > targetDim) vector.subList(targetDim, vector.size()).clear();
                results.add(vector);
            }
            log.info("[Embedding][{}] Gemini batchEmbed API responded in {}ms: {} vectors for {} texts", cid, apiTime, results.size(), texts.size());
            return results;
        } catch (Exception e) {
            log.warn("[Embedding][{}] Gemini batch embedding failed ({}), falling back to individual calls", cid, e.getMessage());
            return texts.stream().map(this::generateEmbedding).toList();
        }
    }

    private String truncate(String text, int maxLen) {
        return text.length() > maxLen ? text.substring(0, maxLen) : text;
    }
}
