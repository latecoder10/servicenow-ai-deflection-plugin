package com.servicedesk.ai.infrastructure.scheduler;

import com.servicedesk.ai.application.port.in.SyncServiceNowUseCase;
import com.servicedesk.ai.domain.settings.PlatformSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


/**
 * The bean is created whenever a cron is configured; whether a given tick actually runs
 * is decided at execution time from the stored setting. Leaving that decision to
 * {@code @ConditionalOnProperty} alone meant an operator could only enable or disable
 * the sync by editing the environment and restarting.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ServiceNowSyncScheduler {

    private final SyncServiceNowUseCase syncServiceNowUseCase;
    private final PlatformSettingsService settings;

    @Value("${scheduler.servicenow.cron:0 0 2 * * ?}")
    private String cron;

    @Value("${scheduler.servicenow.sync-limit:500}")
    private int syncLimit;

    /**
     * Only used on a first run, when no watermark has been stored yet. Kept configurable
     * so a deployment can choose to seed from recent history rather than everything.
     */
    @Value("${scheduler.servicenow.lookback-seconds:86400}")
    private long lookbackSeconds;

    /** Guards against a slow run overlapping the next tick and double-indexing. */
    private final java.util.concurrent.atomic.AtomicBoolean running =
        new java.util.concurrent.atomic.AtomicBoolean(false);

    @Scheduled(cron = "${scheduler.servicenow.cron:0 0 2 * * ?}")
    public void executeScheduledServiceNowSync() {
        // Read per tick, not per startup, so switching the sync off in the settings UI
        // stops the next run rather than waiting for a redeploy.
        if (!settings.getBoolean("scheduler.servicenow.enabled", false)) {
            log.debug("[Scheduler] ServiceNow sync is disabled in settings, skipping this tick");
            return;
        }
        if (!running.compareAndSet(false, true)) {
            log.warn("[Scheduler] Previous ServiceNow sync still in progress, skipping this tick");
            return;
        }

        int effectiveLimit = settings.getInt("scheduler.servicenow.sync-limit", syncLimit);
        log.info("[Scheduler] Triggering periodic ServiceNow sync (limit={})...", effectiveLimit);
        try {
            // No start time: the orchestrator resumes from the watermark of the last
            // successful run. Passing a fixed "now minus N" window here re-fetched and
            // re-embedded the same records on every run, and permanently missed anything
            // that changed while the service was down for longer than the window.
            SyncServiceNowUseCase.Command command = new SyncServiceNowUseCase.Command(
                "ALL",
                null,
                false
            );
            SyncServiceNowUseCase.Result result = syncServiceNowUseCase.sync(command);
            log.info("[Scheduler] ServiceNow sync complete: jobId={}, fetched={}, indexed={}, duration={}ms",
                result.jobId(), result.totalFetched(), result.totalIndexed(), result.durationMillis());
        } catch (Exception e) {
            log.error("[Scheduler] Scheduled ServiceNow sync failed: {}", e.getMessage(), e);
        } finally {
            running.set(false);
        }
    }
}
