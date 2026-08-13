package com.servicedesk.ai.integration.pinecone.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "ai.pinecone")
public class PineconeConfig {
    private String apiKey = "";
    private String host = "";
    private String indexName = "servicedesk-knowledge";
    private int dimension = 1024;
    private String namespacePrefix = "";
}
