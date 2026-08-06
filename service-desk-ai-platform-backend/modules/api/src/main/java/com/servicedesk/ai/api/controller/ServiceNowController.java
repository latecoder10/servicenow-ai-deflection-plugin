package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.application.service.AsyncKnowledgeSyncService;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.AttachmentMetadata;
import com.servicedesk.ai.domain.model.Incident;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@Tag(name = "ServiceNow Integration", description = "ServiceNow Enterprise Synchronization & REST Connector")
@RestController
@RequestMapping("/api/v1/servicenow")
@RequiredArgsConstructor
public class ServiceNowController {

    private final ServiceNowPort serviceNowPort;
    private final ServiceNowConfig serviceNowConfig;
    private final AsyncKnowledgeSyncService syncService;

    @Operation(summary = "Create ServiceNow Incident if AI deflection fails or is declined")
    @PostMapping("/incidents")
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident) {
        Incident created = serviceNowPort.createIncident(incident);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Test and validate connection health to ServiceNow Instance")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkConnection() {
        boolean healthy = serviceNowPort.validateConnection();
        return ResponseEntity.ok(Map.of(
            "status", healthy ? "CONNECTED" : "DISCONNECTED",
            "instance", serviceNowConfig.getInstanceUrl(),
            "authMode", serviceNowConfig.getAuthMode(),
            "systemOfRecord", serviceNowConfig.getSystemOfRecord()
        ));
    }

    @Operation(summary = "Trigger ServiceNow Incremental Synchronization Pipeline")
    @PostMapping("/sync/incremental")
    public ResponseEntity<Map<String, Object>> triggerIncrementalSync(
            @RequestParam(name = "workspace", defaultValue = AppConstants.DEFAULT_WORKSPACE) String workspace,
            @RequestParam(name = "sinceTimestampMs", required = false) Long sinceTimestampMs) {
        
        Instant since = sinceTimestampMs != null ? Instant.ofEpochMilli(sinceTimestampMs) : Instant.now().minusSeconds(86400 * 7);
        
        SyncRequest request = SyncRequest.builder()
            .connectorType(AppConstants.CONNECTOR_SERVICENOW)
            .syncType("INCREMENTAL")
            .workspace(workspace)
            .sinceTimestamp(since)
            .batchLimit(AppConstants.DEFAULT_BATCH_LIMIT)
            .build();

        String jobId = "sync-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        request.setJobId(jobId);

        syncService.triggerSyncAsync(request);

        return ResponseEntity.accepted().body(Map.of(
            "status", "ACCEPTED",
            "jobId", jobId,
            "message", "Sync job queued. Check status via sync jobs endpoint."
        ));
    }

    @Operation(summary = "Fetch ServiceNow Attachment Metadata without local storage duplication")
    @GetMapping("/attachments/metadata/{attachmentId}")
    public ResponseEntity<AttachmentMetadata> getAttachmentMetadata(@PathVariable(name = "attachmentId") String attachmentId) {
        AttachmentMetadata metadata = serviceNowPort.getAttachmentMetadata(attachmentId);
        return ResponseEntity.ok(metadata);
    }

    @Operation(summary = "Download Attachment payload on-demand from ServiceNow Attachment API")
    @GetMapping("/attachments/download/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachmentProxy(@PathVariable(name = "attachmentId") String attachmentId) {
        AttachmentMetadata metadata = serviceNowPort.getAttachmentMetadata(attachmentId);
        byte[] content = serviceNowPort.downloadAttachmentContent(attachmentId);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + metadata.getFileName() + "\"")
            .contentType(MediaType.parseMediaType(metadata.getMimeType() != null ? metadata.getMimeType() : "application/octet-stream"))
            .body(content);
    }
}
