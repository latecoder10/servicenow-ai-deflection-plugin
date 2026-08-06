package com.servicedesk.ai.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Synchronization Job Request model for knowledge connectors.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncRequest {
    private String jobId;
    private String connectorType; // e.g. SERVICENOW
    private String syncType; // FULL, INCREMENTAL, MANUAL
    private String workspace;
    private Instant sinceTimestamp; // For incremental sync
    private int batchLimit;
}
