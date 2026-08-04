package com.servicedesk.ai.application.port.in;

import java.time.Instant;

public interface SyncServiceNowUseCase {
    record Command(
        String entityType, // INCIDENT or KNOWLEDGE_ARTICLE
        Instant syncFromTime,
        boolean forceFullSync
    ) {}

    record Result(
        String jobId,
        int totalFetched,
        int totalIndexed,
        long durationMillis,
        boolean status
    ) {}

    Result sync(Command command);
}
