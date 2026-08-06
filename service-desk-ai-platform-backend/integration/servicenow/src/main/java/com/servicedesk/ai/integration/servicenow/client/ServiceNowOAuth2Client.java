package com.servicedesk.ai.integration.servicenow.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;

@Slf4j
@Component
public class ServiceNowOAuth2Client {

    private final ServiceNowConfig config;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedToken = "";
    private volatile Instant tokenExpiry = Instant.EPOCH;
    private final Object lock = new Object();

    public ServiceNowOAuth2Client(ServiceNowConfig config) {
        this.config = config;
    }

    public String getValidAccessToken() {
        if (Instant.now().isBefore(tokenExpiry) && cachedToken != null && !cachedToken.isEmpty()) {
            return cachedToken;
        }

        synchronized (lock) {
            if (Instant.now().isBefore(tokenExpiry) && cachedToken != null && !cachedToken.isEmpty()) {
                return cachedToken;
            }
            return fetchNewToken();
        }
    }

    private String fetchNewToken() {
        String tokenUrl = UriComponentsBuilder
            .fromHttpUrl(config.getInstanceUrl())
            .path("/oauth_token.do")
            .toUriString();

        log.info("[ServiceNow OAuth2] Requesting new access token from {}", tokenUrl);

        try {
            RestTemplate rest = createRestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(config.getClientId(), config.getClientSecret());

            org.springframework.util.MultiValueMap<String, String> body = new org.springframework.util.LinkedMultiValueMap<>();
            
            if (config.getUsername() != null && !config.getUsername().isEmpty()) {
                body.add("grant_type", "password");
                body.add("username", config.getUsername());
                body.add("password", config.getPassword());
            } else {
                body.add("grant_type", "client_credentials");
            }

            HttpEntity<org.springframework.util.MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = rest.postForEntity(tokenUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String accessToken = json.path("access_token").asText();
                long expiresIn = json.path("expires_in").asLong(3600);

                this.cachedToken = accessToken;
                this.tokenExpiry = Instant.now().plusSeconds(expiresIn - 300); // refresh 5 min early

                log.info("[ServiceNow OAuth2] Token acquired, expires in {}s", expiresIn);
                return accessToken;
            } else {
                log.error("[ServiceNow OAuth2] Token request failed: status={}", response.getStatusCode());
                throw new RuntimeException("ServiceNow OAuth2 token request failed: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[ServiceNow OAuth2] Failed to obtain token: {}", e.getMessage(), e);
            throw new RuntimeException("ServiceNow OAuth2 authentication failed: " + e.getMessage(), e);
        }
    }

    public void invalidateToken() {
        synchronized (lock) {
            this.cachedToken = "";
            this.tokenExpiry = Instant.EPOCH;
        }
        log.info("[ServiceNow OAuth2] Token cache invalidated");
    }

    private RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(config.getConnectionTimeoutMs());
        factory.setReadTimeout(config.getReadTimeoutMs());
        return new RestTemplate(factory);
    }
}
