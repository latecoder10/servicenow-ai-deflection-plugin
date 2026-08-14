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

    /**
     * Whether to fetch attachment metadata for every incident during a sync.
     *
     * This costs one extra API call per record and the only thing consuming the result
     * is a cosmetic attachmentCount in the index metadata, so it is off by default.
     * Turn it on when attachment content is actually being indexed.
     */
    private boolean fetchAttachmentMetadata = false;
}
