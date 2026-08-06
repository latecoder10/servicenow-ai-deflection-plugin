package com.servicedesk.ai.common.model;

import lombok.Builder;

import java.time.Instant;

@Builder
public record ProblemDetails(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    String correlationId,
    Instant timestamp
) {}
