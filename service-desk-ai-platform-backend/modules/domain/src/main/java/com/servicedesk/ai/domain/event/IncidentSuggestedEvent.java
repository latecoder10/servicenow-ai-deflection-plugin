package com.servicedesk.ai.domain.event;

import java.time.Instant;

public record IncidentSuggestedEvent(
    String suggestionId,
    String queryTitle,
    int confidenceValue,
    boolean deflectionSuccessful,
    String userEmail,
    Instant timestamp
) {}
