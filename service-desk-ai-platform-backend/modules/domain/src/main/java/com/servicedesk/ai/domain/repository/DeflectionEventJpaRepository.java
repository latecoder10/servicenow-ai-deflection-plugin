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

    /**
     * Deflection rate over time, one row per bucket.
     *
     * <p>Native SQL because date_trunc has no JPQL equivalent, and bucketing in Java
     * would mean loading every event just to count them.
     *
     * <p>Returns: bucket start, total queries, deflected, confirmed resolutions,
     * average confidence. Both the offered rate and the confirmed rate are returned so
     * the chart can show what the model claimed alongside what an agent actually
     * accepted - the two diverge, and only the second is a real deflection.
     *
     * @param unit a date_trunc unit, restricted by the caller to 'day' or 'hour'
     */
    @Query(value = """
        select date_trunc(:unit, created_at) as bucket,
               count(*)                                          as queries,
               count(*) filter (where deflected)                 as deflected,
               count(*) filter (where outcome = 'SOLVED')        as confirmed,
               avg(confidence_score)                             as avg_confidence
          from deflection_analytics
         where created_at >= :since
         group by 1
         order by 1
        """, nativeQuery = true)
    List<Object[]> deflectionTrend(@Param("unit") String unit, @Param("since") Instant since);

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
