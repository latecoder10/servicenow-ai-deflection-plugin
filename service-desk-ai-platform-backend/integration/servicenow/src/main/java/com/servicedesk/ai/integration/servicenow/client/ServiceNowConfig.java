package com.servicedesk.ai.integration.servicenow.client;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "servicenow")
public class ServiceNowConfig {
    private String instanceUrl = "https://demo.service-now.com";
    private String clientId = "ai_knowledge_platform_client";
    private String clientSecret = "";
    private String username = "";
    private String password = "";
    private int connectionTimeoutMs = 5000;
    private int readTimeoutMs = 15000;
}
