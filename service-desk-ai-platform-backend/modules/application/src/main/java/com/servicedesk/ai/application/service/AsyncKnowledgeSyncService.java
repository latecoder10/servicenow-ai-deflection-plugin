package com.servicedesk.ai.application.service;

import com.servicedesk.ai.application.connector.KnowledgeConnectorRegistry;
import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.model.SyncResult;
import com.servicedesk.ai.domain.port.out.KnowledgeConnector;
import com.servicedesk.ai.domain.repository.AuditLogJpaRepository;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import com.servicedesk.ai.domain.entity.AuditLogEntity;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service managing asynchronous background knowledge synchronization pipelines.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncKnowledgeSyncService {

    private final KnowledgeConnectorRegistry connectorRegistry;
    private final SyncJobJpaRepository syncJobRepository;
    private final AuditLogJpaRepository auditLogRepository;

    @Async("taskExecutor")
    public CompletableFuture<SyncResult> triggerSyncAsync(SyncRequest request) {
        String jobId = request.getJobId() != null ? request.getJobId() : "sync-" + UUID.randomUUID().toString();
        request.setJobId(jobId);

        String connectorType = request.getConnectorType() != null ? request.getConnectorType().toUpperCase() : "SERVICENOW";
        
        // Save initial job entity in PostgreSQL
        SyncJobEntity jobEntity = SyncJobEntity.builder()
            .jobId(jobId)
            .connectorType(connectorType)
            .syncType(request.getSyncType() != null ? request.getSyncType() : "INCREMENTAL")
            .status("RUNNING")
            .startedAt(LocalDateTime.now())
            .build();
        syncJobRepository.save(jobEntity);

        log.info("[Sync Pipeline] Initiated async sync job {} for connector {}", jobId, connectorType);

        KnowledgeConnector connector = connectorRegistry.getConnector(connectorType)
            .orElseThrow(() -> new IllegalArgumentException("Unsupported knowledge connector: " + connectorType));

        try {
            SyncResult result = connector.synchronize(request);

            // Update PostgreSQL record
            jobEntity.setStatus(result.getStatus());
            jobEntity.setItemsFetched(result.getItemsFetched());
            jobEntity.setItemsCreated(result.getItemsCreated());
            jobEntity.setItemsUpdated(result.getItemsUpdated());
            jobEntity.setItemsSkipped(result.getItemsSkipped());
            jobEntity.setItemsFailed(result.getItemsFailed());
            jobEntity.setExecutionTimeMs(result.getExecutionTimeMs());
            jobEntity.setErrorMessage(result.getErrorMessage());
            jobEntity.setCompletedAt(LocalDateTime.ofInstant(result.getCompletedAt(), ZoneId.systemDefault()));
            syncJobRepository.save(jobEntity);

            // Audit log record
            auditLogRepository.save(AuditLogEntity.builder()
                .eventType("KNOWLEDGE_SYNC_EXECUTED")
                .principal("SyncScheduler")
                .action("Synchronize")
                .resourceType("CONNECTOR")
                .resourceId(connectorType)
                .details(String.format("{\"message\": \"Synced %d items via %s (%s). Created: %d, Updated: %d, Failed: %d in %d ms\"}",
                    result.getItemsFetched(), connectorType, request.getSyncType(),
                    result.getItemsCreated(), result.getItemsUpdated(), result.getItemsFailed(), result.getExecutionTimeMs()))
                .build());

            return CompletableFuture.completedFuture(result);

        } catch (Exception e) {
            log.error("[Sync Pipeline] Job {} failed: {}", jobId, e.getMessage(), e);
            jobEntity.setStatus("FAILED");
            jobEntity.setErrorMessage(e.getMessage());
            jobEntity.setCompletedAt(LocalDateTime.now());
            syncJobRepository.save(jobEntity);

            return CompletableFuture.completedFuture(SyncResult.builder()
                .jobId(jobId)
                .connectorType(connectorType)
                .syncType(request.getSyncType())
                .status("FAILED")
                .errorMessage(e.getMessage())
                .startedAt(Instant.now())
                .completedAt(Instant.now())
                .build());
        }
    }
}
