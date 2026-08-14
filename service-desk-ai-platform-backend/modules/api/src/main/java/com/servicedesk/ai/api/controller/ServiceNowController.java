package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * ServiceNow connectivity diagnostics.
 *
 * Synchronisation lives on the connector API ({@code /api/v1/connectors/SERVICENOW/...}),
 * which is the single entry point for every knowledge source. This controller keeps only
 * the credential check, because a failure here has a very different cause from a failure
 * anywhere else and is worth isolating.
 */
@Tag(name = "ServiceNow Connectivity", description = "Credential and reachability diagnostics for the ServiceNow instance")
@RestController
@RequestMapping("/api/v1/servicenow")
@RequiredArgsConstructor
public class ServiceNowController {

    private final ServiceNowPort serviceNowPort;
    private final ServiceNowConfig serviceNowConfig;

    @Operation(summary = "Verify credentials and reachability of the configured ServiceNow instance")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkConnection() {
        boolean healthy = serviceNowPort.validateConnection();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", healthy ? "CONNECTED" : "DISCONNECTED");
        body.put("instance", serviceNowConfig.getInstanceUrl());
        body.put("authMode", serviceNowConfig.getAuthMode());
        body.put("systemOfRecord", serviceNowConfig.getSystemOfRecord());

        // DISCONNECTED has several very different causes and the boolean hides all of
        // them, so point at where the actual reason is recorded.
        if (!healthy) {
            body.put("hint", "Check the application log for '[ServiceNow OAuth2]' and "
                + "'Connection validation failed'. A token that is issued but then rejected "
                + "means the OAuth entity is scope-restricted rather than the credentials "
                + "being wrong.");
        }

        return ResponseEntity.ok(body);
    }
}
