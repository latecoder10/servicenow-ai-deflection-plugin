package com.servicedesk.ai.integration.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.common.model.CorrelationContext;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.domain.model.ResolutionSuggestion;
import com.servicedesk.ai.domain.port.out.LlmPort;
import com.servicedesk.ai.integration.llm.config.LlmConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class SpringAiLlmAdapter implements LlmPort {

    private final RerankingEngine rerankingEngine;
    private final LlmConfig llmConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ResolutionSuggestion generateResolution(
        String userTitle,
        String userDescription,
        String userDepartment,
        List<KnowledgeChunk> contextChunks,
        String promptTemplate
    ) {
        String cid = CorrelationContext.getCorrelationId();
        log.info("[LLM][{}] Invoking {} model for query: '{}' with {} context chunks",
            cid, llmConfig.getModelName(), userTitle, contextChunks.size());

        if (llmConfig.getApiKey() == null || llmConfig.getApiKey().isBlank()) {
            throw new IllegalStateException("Gemini API key (ai.llm.api-key or GEMINI_API_KEY) is not configured.");
        }

        try {
            String model = llmConfig.getModelName();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + llmConfig.getApiKey();

            String fullPrompt = buildSystemPrompt() + "\n\n" + promptTemplate;

            log.debug("[LLM][{}] Sending prompt ({} chars) to Gemini API", cid, fullPrompt.length());

            Map<String, Object> generationConfig = new java.util.HashMap<>();
            generationConfig.put("temperature", llmConfig.getTemperature());
            generationConfig.put("maxOutputTokens", llmConfig.getMaxOutputTokens());

            // Thinking tokens are drawn from maxOutputTokens. Left at the default the
            // model exhausts the budget before STEPS/COMMAND are written.
            String thinkingLevel = llmConfig.getThinkingLevel();
            if (thinkingLevel != null && !thinkingLevel.isBlank()) {
                generationConfig.put("thinkingConfig", Map.of("thinkingLevel", thinkingLevel));
            }

            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(Map.of("text", fullPrompt))
                )),
                "generationConfig", generationConfig
            );

            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            long start = System.currentTimeMillis();
            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, request, String.class);
            long apiTime = System.currentTimeMillis() - start;

            JsonNode root = objectMapper.readTree(response.getBody());

            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                log.error("[LLM][{}] No candidates in Gemini response: {}", cid, response.getBody());
                throw new RuntimeException("Gemini returned no candidates");
            }

            String generatedText = candidates.path(0)
                .path("content").path("parts")
                .path(0).path("text").asText("");

            String finishReason = candidates.path(0).path("finishReason").asText("unknown");
            log.info("[LLM][{}] Gemini API responded in {}ms: {} chars, finishReason={}",
                cid, apiTime, generatedText.length(), finishReason);

            if ("MAX_TOKENS".equals(finishReason)) {
                log.warn("[LLM][{}] Response truncated at {} tokens - STEPS/COMMAND are likely missing. "
                    + "Raise ai.llm.max-output-tokens or set ai.llm.thinking-level=low.",
                    cid, llmConfig.getMaxOutputTokens());
            }
            log.debug("[LLM][{}] Raw LLM response:\n{}", cid, generatedText);

            ResolutionSuggestion suggestion = parseLlmResponse(generatedText, userTitle, userDescription, contextChunks);
            log.info("[LLM][{}] Parsed resolution: title='{}', steps={}, command={}",
                cid, suggestion.getRecommendedTitle(),
                suggestion.getStepByStepInstructions() != null ? suggestion.getStepByStepInstructions().size() : 0,
                suggestion.getCodeOrCommandSnippet() != null && !suggestion.getCodeOrCommandSnippet().isEmpty() ? "yes" : "none");

            return suggestion;

        } catch (Exception e) {
            log.error("[LLM][{}] Gemini LLM call failed: {}", cid, e.getMessage(), e);
            throw new RuntimeException("Failed to generate resolution from Gemini LLM: " + e.getMessage(), e);
        }
    }

    private String buildSystemPrompt() {
        return """
            You are an Enterprise AI Service Desk Agent. Analyze the IT ticket and provide a resolution based on the retrieved knowledge base context.

            Respond EXACTLY in this format (each section on its own line):

            TITLE: <concise resolution title>
            SUMMARY: <1-2 sentence summary>
            STEPS:
            1. <first step>
            2. <second step>
            3. <third step>
            COMMAND: <command or script, or write NONE>

            Rules:
            - Start each step with a number and period
            - Include specific commands, paths, or URLs when available
            - Keep steps actionable and specific
            """;
    }

    private ResolutionSuggestion parseLlmResponse(
        String generatedText,
        String userTitle,
        String userDescription,
        List<KnowledgeChunk> contextChunks
    ) {
        String recommendedTitle = extractAfterLabel(generatedText, "TITLE");
        String summary = extractAfterLabel(generatedText, "SUMMARY");
        List<String> steps = extractNumberedSteps(generatedText);
        String command = extractAfterLabel(generatedText, "COMMAND");

        if (recommendedTitle == null || recommendedTitle.isBlank()) {
            recommendedTitle = "Resolution for: " + userTitle;
        }
        if (summary == null || summary.isBlank()) {
            summary = "Resolution generated based on retrieved knowledge base context.";
        }
        if (steps.isEmpty()) {
            steps = List.of("Review the provided knowledge base context for resolution steps.");
        }
        if (command == null || command.isBlank() || command.equalsIgnoreCase("NONE")) {
            command = "";
        }

        return ResolutionSuggestion.builder()
            .suggestionId("sug-" + UUID.randomUUID().toString().substring(0, 8))
            .queryTitle(userTitle)
            .queryDescription(userDescription)
            .recommendedTitle(recommendedTitle)
            .summaryResolution(summary)
            .stepByStepInstructions(steps)
            .codeOrCommandSnippet(command)
            .referencedSources(contextChunks)
            .generatedByModel(llmConfig.getModelName())
            .createdAt(Instant.now())
            .correlationId(CorrelationContext.getCorrelationId())
            .build();
    }

    private String extractAfterLabel(String text, String label) {
        // Match "LABEL: content" where content runs to next label or end
        String escapedLabel = Pattern.quote(label);
        Pattern pattern = Pattern.compile(
            escapedLabel + "\\s*:\\s*(.+?)(?=\\n(?:TITLE|SUMMARY|STEPS|COMMAND)\\s*:|$)",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
        );
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        // Fallback: try simple "LABEL: content" to end of line
        Pattern simplePattern = Pattern.compile(escapedLabel + "\\s*:\\s*(.+?)$", Pattern.MULTILINE | Pattern.CASE_INSENSITIVE);
        Matcher simpleMatcher = simplePattern.matcher(text);
        return simpleMatcher.find() ? simpleMatcher.group(1).trim() : null;
    }

    private List<String> extractNumberedSteps(String text) {
        List<String> steps = new ArrayList<>();
        // Match lines starting with number + period
        Pattern stepPattern = Pattern.compile("^\\s*\\d+[.)]\\s+(.+)$", Pattern.MULTILINE);
        Matcher matcher = stepPattern.matcher(text);
        while (matcher.find()) {
            String step = matcher.group(1).trim();
            if (!step.isEmpty()) {
                steps.add(step);
            }
        }
        return steps;
    }

    @Override
    public List<KnowledgeChunk> rerank(String queryText, List<KnowledgeChunk> candidateChunks, int topN) {
        return rerankingEngine.rerankChunks(queryText, candidateChunks, topN);
    }
}
