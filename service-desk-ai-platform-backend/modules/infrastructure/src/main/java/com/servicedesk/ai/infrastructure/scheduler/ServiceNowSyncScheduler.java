package com.servicedesk.ai.infrastructure.scheduler;

import com.servicedesk.ai.application.port.in.SyncServiceNowUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${scheduler.servicenow.cron:0 */15 * * * *}")
    private String cron;

    @Value("${scheduler.servicenow.sync-limit:100}")
    private int syncLimit;

    @Scheduled(cron = "${scheduler.servicenow.cron:0 */15 * * * *}")
    public void executeScheduledServiceNowSync() {
        log.info("[Scheduler] Triggering periodic ServiceNow sync (limit={})...", syncLimit);
        try {
            SyncServiceNowUseCase.Command command = new SyncServiceNowUseCase.Command(
                "ALL",
                Instant.now().minusSeconds(900), // last 15 min
                false
            );
            SyncServiceNowUseCase.Result result = syncServiceNowUseCase.sync(command);
            log.info("[Scheduler] ServiceNow sync complete: jobId={}, fetched={}, indexed={}, duration={}ms",
                result.jobId(), result.totalFetched(), result.totalIndexed(), result.durationMillis());
        } catch (Exception e) {
            log.error("[Scheduler] Scheduled ServiceNow sync failed: {}", e.getMessage(), e);
        }
    }
}
