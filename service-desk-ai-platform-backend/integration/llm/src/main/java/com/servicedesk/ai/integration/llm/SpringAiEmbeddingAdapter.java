package com.servicedesk.ai.integration.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + embeddingConfig.getModelName() + ":embedContent?key=" + apiKey;

            Map<String, Object> body = Map.of(
                "model", "models/" + embeddingConfig.getModelName(),
                "content", Map.of("parts", List.of(Map.of("text", truncate(textContent, 20000))))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode values = root.path("embedding").path("values");

            List<Float> vector = new ArrayList<>();
            values.forEach(v -> vector.add(v.floatValue()));
            log.info("Generated {}-dim Gemini embedding for text length {}", vector.size(), textContent.length());
            return vector;
        } catch (Exception e) {
            log.warn("Gemini embedding failed ({}), using placeholder", e.getMessage());
            return generatePlaceholder(textContent);
        }
    }

    @Override
    public List<List<Float>> generateBatchEmbeddings(List<String> textBatch) {
        log.info("Batch generating embeddings for {} items", textBatch.size());
        return textBatch.stream().map(this::generateEmbedding).toList();
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
