package com.servicedesk.ai.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * One AI suggestion, recorded when it is produced.
 *
 * These rows are what makes deflection reportable. Counting in memory meant the
 * numbers reset on every restart, so the platform could never answer "how many
 * tickets did this avoid last month".
 */
@Entity
@Table(name = "deflection_analytics", indexes = {
    @Index(name = "idx_deflection_created", columnList = "created_at"),
    @Index(name = "idx_deflection_suggestion", columnList = "suggestion_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeflectionEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Correlates this row with the suggestion returned to the caller. */
    @Column(name = "suggestion_id", length = 100)
    private String suggestionId;

    @Column(name = "incident_sys_id", length = 100)
    private String incidentSysId;

    @Column(name = "query_text", columnDefinition = "TEXT")
    private String queryText;

    /** Whether the suggestion cleared the configured confidence threshold. */
    @Column(name = "deflected", nullable = false)
    private boolean deflected;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "resolution_suggested", columnDefinition = "TEXT")
    private String resolutionSuggested;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "department", length = 100)
    private String department;

    /** How many knowledge sources grounded the answer; zero means it was unsupported. */
    @Column(name = "sources_count")
    private Integer sourcesCount;

    @Column(name = "model_used", length = 100)
    private String modelUsed;

    /** End-to-end time, so slow answers can be found without trawling the logs. */
    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(name = "caller_email", length = 150)
    private String callerEmail;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    /**
     * What the user did with it: SOLVED, CONTINUED, or null while still unanswered.
     * Set later by the feedback endpoint rather than at creation.
     */
    @Column(name = "outcome", length = 30)
    private String outcome;

    @Column(name = "outcome_at")
    private Instant outcomeAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
