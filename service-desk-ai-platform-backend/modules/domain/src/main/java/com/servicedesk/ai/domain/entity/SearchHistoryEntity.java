package com.servicedesk.ai.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * A record of what was searched for and how well it went.
 *
 * A query that returns nothing, or returns weak matches repeatedly, is the most
 * direct evidence of a gap in the knowledge base.
 */
@Entity
@Table(name = "search_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "query_text", nullable = false, columnDefinition = "TEXT")
    private String queryText;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "top_k")
    private Integer topK;

    @Column(name = "results_returned")
    private Integer resultsReturned;

    /** Best similarity in the result set; low values mean the corpus had no good answer. */
    @Column(name = "top_score")
    private Double topScore;

    @Column(name = "latency_ms")
    private Long latencyMs;

    /** Which entry point asked: SEARCH_API or DEFLECTION_PANEL. */
    @Column(name = "source", length = 50)
    private String source;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
