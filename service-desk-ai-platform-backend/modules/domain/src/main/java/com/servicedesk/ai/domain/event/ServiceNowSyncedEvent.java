package com.servicedesk.ai.domain.event;

import java.time.Instant;

public record ServiceNowSyncedEvent(
    String syncJobId,
    String entityType, // "INCIDENT" or "KNOWLEDGE_ARTICLE"
    int recordsFetched,
    int recordsIndexed,
    long durationMillis,
    Instant timestamp
) {}
