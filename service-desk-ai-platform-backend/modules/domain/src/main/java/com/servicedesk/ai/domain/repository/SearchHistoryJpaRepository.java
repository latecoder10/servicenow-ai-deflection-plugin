package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.SearchHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface SearchHistoryJpaRepository extends JpaRepository<SearchHistoryEntity, UUID> {

    long countByCreatedAtAfter(Instant since);

    /** Searches that found nothing at all: an outright gap in the corpus. */
    @Query("""
        select s.queryText, count(s)
        from SearchHistoryEntity s
        where s.createdAt > :since and s.resultsReturned = 0
        group by s.queryText
        order by count(s) desc
        """)
    List<Object[]> queriesWithNoResultsSince(@Param("since") Instant since);

    /**
     * The most asked questions in a window. Ranking by volume shows where an article,
     * or an automation, would remove the most work.
     */
    @Query("""
        select lower(s.queryText), count(s), avg(s.topScore)
        from SearchHistoryEntity s
        where s.createdAt > :since
        group by lower(s.queryText)
        order by count(s) desc
        """)
    List<Object[]> mostFrequentQueriesSince(@Param("since") Instant since);

    List<SearchHistoryEntity> findTop20ByOrderByCreatedAtDesc();
}
