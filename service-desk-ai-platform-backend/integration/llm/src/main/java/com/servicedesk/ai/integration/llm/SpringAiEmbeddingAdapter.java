package com.servicedesk.ai.integration.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("demo-key")) {
            log.warn("No Gemini API key configured, using placeholder vector");
            return generatePlaceholder(textContent);
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

            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode values = root.path("embedding").path("values");

            List<Float> vector = new ArrayList<>();
            values.forEach(v -> vector.add(v.floatValue()));
            
            // Pad or truncate to match Pinecone dimension
            int targetDim = embeddingConfig.getDimension();
            while (vector.size() < targetDim) {
                vector.add(0.0f);
            }
            if (vector.size() > targetDim) {
                vector.subList(targetDim, vector.size()).clear();
            }
            
            log.info("Generated {}-dim Gemini embedding for text length {}", vector.size(), textContent.length());
            return vector;
        } catch (Exception e) {
            log.warn("Gemini embedding failed ({}), using placeholder", e.getMessage());
            return generatePlaceholder(textContent);
        }
    }

    @Override
    public List<List<Float>> generateBatchEmbeddings(List<String> textBatch) {
        if (textBatch.isEmpty()) return List.of();
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("demo-key")) {
            log.warn("No Gemini API key configured, using placeholder vectors for batch");
            return textBatch.stream().map(this::generatePlaceholder).toList();
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

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode embeddings = root.path("embeddings");

            int targetDim = embeddingConfig.getDimension();
            List<List<Float>> results = new ArrayList<>();
            for (JsonNode emb : embeddings) {
                List<Float> vector = new ArrayList<>();
                emb.path("values").forEach(v -> vector.add(v.floatValue()));
                // Pad or truncate to target dimension
                while (vector.size() < targetDim) vector.add(0.0f);
                if (vector.size() > targetDim) vector.subList(targetDim, vector.size()).clear();
                results.add(vector);
            }
            return results;
        } catch (Exception e) {
            log.warn("Gemini batch embedding failed ({}), falling back to individual calls", e.getMessage());
            return texts.stream().map(this::generateEmbedding).toList();
        }
    }

    private List<Float> generatePlaceholder(String textContent) {
        List<Float> vector = new ArrayList<>(embeddingConfig.getDimension());
        float baseHash = Math.abs(textContent.hashCode()) % 1000 / 1000.0f;
        for (int i = 0; i < embeddingConfig.getDimension(); i++) {
            vector.add((float) Math.sin(baseHash + i));
        }
        return vector;
    }

    private String truncate(String text, int maxLen) {
        return text.length() > maxLen ? text.substring(0, maxLen) : text;
    }
}
