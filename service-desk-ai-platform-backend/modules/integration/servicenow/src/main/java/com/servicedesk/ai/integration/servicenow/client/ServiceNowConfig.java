package com.servicedesk.ai.integration.servicenow.client;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "servicenow")
public class ServiceNowConfig {
    private String instanceUrl;
    private String clientId = "";
    private String clientSecret = "";
    private String username = "";
    private String password = "";
    private String authMode = "OAuth2.0 Bearer";
    private String systemOfRecord = "ServiceNow ITSM & Knowledge";
    private int connectionTimeoutMs = 5000;
    private int readTimeoutMs = 15000;
}
