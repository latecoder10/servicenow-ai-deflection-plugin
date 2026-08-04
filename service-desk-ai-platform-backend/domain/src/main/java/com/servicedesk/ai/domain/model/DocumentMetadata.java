package com.servicedesk.ai.domain.model;

import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Builder
public record DocumentMetadata(
    String documentId,
    String title,
    DocumentSourceType sourceType,
    String sourceUri,
    String department,
    String category,
    String ownerEmail,
    Set<String> tags,
    String version,
    Instant createdDate,
    Instant lastIndexedDate,
    Map<String, String> customAttributes
) {
}
