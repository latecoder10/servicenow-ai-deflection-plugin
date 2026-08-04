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
    private String apiKey = "demo-key";
}
