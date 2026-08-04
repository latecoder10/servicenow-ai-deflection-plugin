package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "indexing_jobs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndexingJobEntity extends AuditableEntity {

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "chunks_processed")
    @Builder.Default
    private Integer chunksProcessed = 0;

    @Column(name = "total_chunks")
    @Builder.Default
    private Integer totalChunks = 0;

    @Column(name = "progress_percentage")
    @Builder.Default
    private Integer progressPercentage = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;
}
