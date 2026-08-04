package com.servicedesk.ai.infrastructure.scheduler;

import com.servicedesk.ai.application.port.in.SyncServiceNowUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "scheduler.servicenow.enabled", havingValue = "true", matchIfMissing = false)
public class ServiceNowSyncScheduler {

    private final SyncServiceNowUseCase syncServiceNowUseCase;

    // Cron schedule: Every 15 minutes
    @Scheduled(cron = "0 */15 * * * *")
    public void executeScheduledServiceNowSync() {
        log.info("[Scheduler] Triggering periodic 15-min ServiceNow Knowledge & Incident Sync job...");
        try {
            SyncServiceNowUseCase.Command command = new SyncServiceNowUseCase.Command(
                "INCIDENT",
                Instant.now().minusSeconds(900),
                false
            );
            SyncServiceNowUseCase.Result result = syncServiceNowUseCase.sync(command);
            log.info("[Scheduler] ServiceNow Sync complete. JobId: {}, Fetched: {}, Duration: {} ms",
                result.jobId(), result.totalFetched(), result.durationMillis());
        } catch (Exception e) {
            log.error("[Scheduler] Scheduled ServiceNow sync failed: {}", e.getMessage(), e);
        }
    }
}
