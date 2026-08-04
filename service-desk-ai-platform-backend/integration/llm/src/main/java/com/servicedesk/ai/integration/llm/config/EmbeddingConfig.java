package com.servicedesk.ai.integration.llm.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai.embedding")
public class EmbeddingConfig {
    private String provider = "GEMINI";
    private String modelName = "text-embedding-005";
    private int dimension = 1024;
}
