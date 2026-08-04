package com.servicedesk.ai.integration.servicenow.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServiceNowOAuth2Client {

    private final ServiceNowConfig config;
    private String cachedToken = "";
    private Instant tokenExpiry = Instant.now().plusSeconds(3600);

    public String getValidAccessToken() {
        if (Instant.now().isAfter(tokenExpiry)) {
            log.info("Refreshing ServiceNow OAuth2 Bearer Token from {}", config.getInstanceUrl());
            this.cachedToken = "mock_sn_oauth_access_token_" + System.currentTimeMillis();
            this.tokenExpiry = Instant.now().plusSeconds(3600);
        }
        return cachedToken;
    }
}
