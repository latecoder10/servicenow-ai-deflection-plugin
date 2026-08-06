package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_jobs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncJobEntity extends AuditableEntity {

    @Column(name = "job_id", length = 100, nullable = false, unique = true)
    private String jobId;

    @Column(name = "connector_type", length = 50, nullable = false)
    private String connectorType; // SERVICENOW, etc.

    @Column(name = "sync_type", length = 50, nullable = false)
    private String syncType; // FULL, INCREMENTAL, MANUAL

    @Column(name = "status", length = 50, nullable = false)
    private String status; // RUNNING, COMPLETED, FAILED, CANCELLED

    @Column(name = "items_fetched")
    @Builder.Default
    private Integer itemsFetched = 0;

    @Column(name = "items_created")
    @Builder.Default
    private Integer itemsCreated = 0;

    @Column(name = "items_updated")
    @Builder.Default
    private Integer itemsUpdated = 0;

    @Column(name = "items_deleted")
    @Builder.Default
    private Integer itemsDeleted = 0;

    @Column(name = "items_skipped")
    @Builder.Default
    private Integer itemsSkipped = 0;

    @Column(name = "items_failed")
    @Builder.Default
    private Integer itemsFailed = 0;

    @Column(name = "execution_time_ms")
    @Builder.Default
    private Long executionTimeMs = 0L;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
