package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.application.connector.KnowledgeConnectorRegistry;
import com.servicedesk.ai.application.service.AsyncKnowledgeSyncService;
import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.port.out.KnowledgeConnector;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Connector Management", description = "Enterprise Knowledge Connector Management (ServiceNow, Jira, Confluence, SharePoint)")
@RestController
@RequestMapping("/api/v1/connectors")
@RequiredArgsConstructor
public class ConnectorController {

    private final KnowledgeConnectorRegistry connectorRegistry;
    private final AsyncKnowledgeSyncService syncService;
    private final SyncJobJpaRepository syncJobRepository;

    /**
     * Connector reachability is cached because the Incident sidebar asks for it on every
     * form load, and each miss costs a round trip to the source system.
     */
    private final Map<String, CachedStatus> statusCache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final long STATUS_TTL_MS = 120_000;

    private record CachedStatus(boolean connected, long checkedAt) {
        boolean isFresh() {
            return System.currentTimeMillis() - checkedAt < STATUS_TTL_MS;
        }
    }

    @Operation(summary = "Reachability of every registered connector, for UI status indicators")
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> connectorStatus(
            @RequestParam(name = "refresh", defaultValue = "false") boolean refresh) {

        Map<String, Object> statuses = new java.util.LinkedHashMap<>();

        for (String type : connectorRegistry.getAvailableConnectorTypes()) {
            CachedStatus cached = statusCache.get(type);
            boolean connected;

            if (!refresh && cached != null && cached.isFresh()) {
                connected = cached.connected();
            } else {
                connected = connectorRegistry.getConnector(type)
                    .map(c -> {
                        try {
                            return c.testConnection(Map.of());
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .orElse(false);
                statusCache.put(type, new CachedStatus(connected, System.currentTimeMillis()));
            }

            statuses.put(type, Map.of(
                "connected", connected,
                "status", connected ? "CONNECTED" : "DISCONNECTED"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "connectors", statuses,
            "cacheTtlSeconds", STATUS_TTL_MS / 1000
        ));
    }

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

    @Operation(summary = "Queue a synchronization job for a knowledge connector")
    @PostMapping("/{connectorType}/sync")
    public ResponseEntity<Map<String, Object>> triggerConnectorSync(
            @PathVariable String connectorType,
            @RequestBody(required = false) SyncRequest request) {

        String type = connectorType.toUpperCase();
        // Fail here rather than inside the async worker, where the caller would get a
        // queued response for a connector that does not exist.
        connectorRegistry.getConnector(type)
            .orElseThrow(() -> new IllegalArgumentException("Unsupported connector type: " + connectorType));

        SyncRequest job = request != null ? request : SyncRequest.builder().build();
        job.setConnectorType(type);
        if (job.getSyncType() == null || job.getSyncType().isBlank()) {
            job.setSyncType("INCREMENTAL");
        }
        if (job.getJobId() == null || job.getJobId().isBlank()) {
            job.setJobId("sync-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        }

        // Returning the CompletableFuture from inside a ResponseEntity made Spring wait
        // for the whole sync before answering, so a large run timed out at the proxy.
        // The job is queued and the caller polls the history endpoint instead.
        syncService.triggerSyncAsync(job);

        return ResponseEntity.accepted().body(Map.of(
            "status", "ACCEPTED",
            "jobId", job.getJobId(),
            "connectorType", type,
            "syncType", job.getSyncType(),
            "message", "Sync queued. Poll /api/v1/connectors/" + type + "/history for the outcome."
        ));
    }

    @Operation(summary = "View sync job execution history for a connector")
    @GetMapping("/{connectorType}/history")
    public ResponseEntity<List<SyncJobEntity>> getSyncHistory(@PathVariable String connectorType) {
        return ResponseEntity.ok(syncJobRepository.findByConnectorTypeOrderByStartedAtDesc(connectorType.toUpperCase()));
    }
}
