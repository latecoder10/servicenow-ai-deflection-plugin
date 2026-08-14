package com.servicedesk.ai.application.service;

import com.servicedesk.ai.application.connector.GoogleDriveKnowledgeConnector;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.model.SyncResult;
import com.servicedesk.ai.integration.gdrive.config.GoogleDriveConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Periodic incremental pull from Google Drive.
 *
 * The connector keeps its own watermark, so this only has to decide when to run.
 * Runs are guarded against overlap: a long first sync must not have a second run
 * start on top of it and index the same files twice.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "scheduler.gdrive", name = "enabled", havingValue = "true")
public class GoogleDriveSyncScheduler {

    private final GoogleDriveKnowledgeConnector connector;
    private final GoogleDriveConfig driveConfig;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Scheduled(cron = "${scheduler.gdrive.cron:0 30 2 * * ?}")
    public void syncDrive() {
        if (!driveConfig.isEnabled()) {
            log.debug("[Drive Scheduler] Skipped: gdrive.enabled is false");
            return;
        }
        if (!running.compareAndSet(false, true)) {
            log.warn("[Drive Scheduler] Previous run still in progress, skipping this tick");
            return;
        }

        String jobId = "gdrive-" + UUID.randomUUID().toString().substring(0, 8);
        try {
            log.info("[Drive Scheduler] Starting incremental sync, job {}", jobId);

            SyncRequest request = SyncRequest.builder()
                .jobId(jobId)
                .connectorType(GoogleDriveKnowledgeConnector.CONNECTOR_TYPE)
                .syncType("INCREMENTAL")
                .batchLimit(driveConfig.getMaxFilesPerSync())
                .build();

            SyncResult result = connector.synchronize(request);

            log.info("[Drive Scheduler] Job {} {} in {}ms: {} fetched, {} indexed, {} skipped, {} failed",
                jobId, result.getStatus(), result.getExecutionTimeMs(),
                result.getItemsFetched(), result.getItemsCreated(),
                result.getItemsSkipped(), result.getItemsFailed());

            if (result.getErrorMessage() != null) {
                log.warn("[Drive Scheduler] Job {} reported: {}", jobId, result.getErrorMessage());
            }
        } catch (Exception e) {
            log.error("[Drive Scheduler] Job {} threw: {}", jobId, e.getMessage(), e);
        } finally {
            running.set(false);
        }
    }
}
