package com.servicedesk.ai.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Result metrics and execution summary of a knowledge synchronization run.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncResult {
    private String jobId;
    private String connectorType;
    private String syncType;
    private String status; // IN_PROGRESS, COMPLETED, FAILED, COMPLETED_WITH_ERRORS
    private int itemsFetched;
    private int itemsCreated;
    private int itemsUpdated;
    private int itemsDeleted;
    private int itemsSkipped;
    private int itemsFailed;
    private long executionTimeMs;
    private String errorMessage;
    private Instant startedAt;
    private Instant completedAt;
}
