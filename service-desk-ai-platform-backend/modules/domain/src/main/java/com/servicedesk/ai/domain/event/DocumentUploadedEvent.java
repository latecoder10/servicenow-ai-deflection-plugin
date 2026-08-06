package com.servicedesk.ai.domain.event;

import com.servicedesk.ai.domain.model.DocumentMetadata;

import java.time.Instant;

public record DocumentUploadedEvent(
    String documentId,
    DocumentMetadata metadata,
    int totalChunksGenerated,
    Instant timestamp
) {}
