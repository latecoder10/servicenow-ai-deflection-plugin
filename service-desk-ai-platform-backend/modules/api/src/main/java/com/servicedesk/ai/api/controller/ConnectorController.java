package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.application.connector.KnowledgeConnectorRegistry;
import com.servicedesk.ai.application.service.AsyncKnowledgeSyncService;
import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.model.SyncResult;
import com.servicedesk.ai.domain.port.out.KnowledgeConnector;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Tag(name = "Connector Management", description = "Enterprise Knowledge Connector Management (ServiceNow, Jira, Confluence, SharePoint)")
@RestController
@RequestMapping("/api/v1/connectors")
@RequiredArgsConstructor
public class ConnectorController {

    private final KnowledgeConnectorRegistry connectorRegistry;
    private final AsyncKnowledgeSyncService syncService;
    private final SyncJobJpaRepository syncJobRepository;

    @Operation(summary = "List all registered enterprise knowledge connector types")
    @GetMapping
    public ResponseEntity<List<String>> listAvailableConnectors() {
        return ResponseEntity.ok(connectorRegistry.getAvailableConnectorTypes());
    }

    @Operation(summary = "Test connection health for a specified connector type")
    @PostMapping("/{connectorType}/test")
    public ResponseEntity<Map<String, Object>> testConnectorConnection(
            @PathVariable String connectorType,
            @RequestBody(required = false) Map<String, String> configMap) {

        KnowledgeConnector connector = connectorRegistry.getConnector(connectorType)
            .orElseThrow(() -> new IllegalArgumentException("Unsupported connector type: " + connectorType));

        boolean healthy = connector.testConnection(configMap != null ? configMap : Map.of());
        return ResponseEntity.ok(Map.of(
            "connectorType", connectorType.toUpperCase(),
            "status", healthy ? "CONNECTED" : "DISCONNECTED",
            "message", healthy ? "Connection successfully validated to System of Record" : "Connection failed"
        ));
    }

    @Operation(summary = "Trigger synchronization job for a knowledge connector")
    @PostMapping("/{connectorType}/sync")
    public ResponseEntity<CompletableFuture<SyncResult>> triggerConnectorSync(
            @PathVariable String connectorType,
            @RequestBody SyncRequest request) {

        request.setConnectorType(connectorType.toUpperCase());
        return ResponseEntity.ok(syncService.triggerSyncAsync(request));
    }

    @Operation(summary = "View sync job execution history for a connector")
    @GetMapping("/{connectorType}/history")
    public ResponseEntity<List<SyncJobEntity>> getSyncHistory(@PathVariable String connectorType) {
        return ResponseEntity.ok(syncJobRepository.findByConnectorTypeOrderByStartedAtDesc(connectorType.toUpperCase()));
    }
}
