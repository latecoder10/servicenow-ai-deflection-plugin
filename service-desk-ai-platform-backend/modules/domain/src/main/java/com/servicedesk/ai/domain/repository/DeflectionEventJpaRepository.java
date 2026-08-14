package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.DeflectionEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeflectionEventJpaRepository extends JpaRepository<DeflectionEventEntity, UUID> {

    Optional<DeflectionEventEntity> findBySuggestionId(String suggestionId);

    long countByCreatedAtAfter(Instant since);

    long countByDeflectedTrueAndCreatedAtAfter(Instant since);

    /** Suggestions the agent explicitly confirmed resolved the problem. */
    long countByOutcomeAndCreatedAtAfter(String outcome, Instant since);

    @Query("select avg(d.confidenceScore) from DeflectionEventEntity d where d.createdAt > :since")
    Double averageConfidenceSince(@Param("since") Instant since);

    @Query("select avg(d.latencyMs) from DeflectionEventEntity d where d.createdAt > :since")
    Double averageLatencySince(@Param("since") Instant since);

    /**
     * Which categories generate the most questions. This is the evidence for where a
     * new knowledge article would pay off most, rather than guessing.
     */
    @Query("""
        select d.category, count(d),
               sum(case when d.deflected = true then 1 else 0 end),
               avg(d.confidenceScore)
        from DeflectionEventEntity d
        where d.createdAt > :since and d.category is not null
        group by d.category
        order by count(d) desc
        """)
    List<Object[]> categoryBreakdownSince(@Param("since") Instant since);

    /**
     * Recurring questions the AI answered with low confidence: the clearest signal that
     * a knowledge gap exists, because people keep asking and the corpus keeps failing.
     */
    @Query("""
        select d.queryText, count(d), avg(d.confidenceScore)
        from DeflectionEventEntity d
        where d.createdAt > :since and d.deflected = false
        group by d.queryText
        having count(d) >= :minOccurrences
        order by count(d) desc
        """)
    List<Object[]> unresolvedThemesSince(@Param("since") Instant since,
                                         @Param("minOccurrences") long minOccurrences);

    List<DeflectionEventEntity> findTop20ByOrderByCreatedAtDesc();
}
