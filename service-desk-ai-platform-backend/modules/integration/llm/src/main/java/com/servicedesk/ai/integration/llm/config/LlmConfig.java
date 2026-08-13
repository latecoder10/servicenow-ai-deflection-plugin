package com.servicedesk.ai.integration.llm.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai.llm")
public class LlmConfig {
    private String provider = "GEMINI";
    private String modelName = "gemini-3.6-flash";
    private String apiKey = "";

    /**
     * Budget for thinking + visible output combined. Thinking models spend this
     * before emitting anything, so a low ceiling truncates the response mid-format
     * (finishReason=MAX_TOKENS with only TITLE/SUMMARY present).
     */
    private int maxOutputTokens = 2048;

    /**
     * Thinking effort: "low" or "high". This structured extraction task wants "low" —
     * the reasoning is already done by retrieval + reranking, and heavy thinking eats
     * the token budget before STEPS/COMMAND are written.
     *
     * Leave blank to omit thinkingConfig entirely. Note that gemini-3.6-flash rejects
     * the older thinkingBudget field with 400 INVALID_ARGUMENT; it only accepts
     * thinkingLevel.
     */
    private String thinkingLevel = "low";

    private double temperature = 0.3;
}
