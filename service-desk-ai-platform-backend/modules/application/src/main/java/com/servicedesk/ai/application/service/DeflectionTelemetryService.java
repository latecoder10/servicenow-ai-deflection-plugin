package com.servicedesk.ai.application.service;

import com.servicedesk.ai.domain.entity.DeflectionEventEntity;
import com.servicedesk.ai.domain.entity.SearchHistoryEntity;
import com.servicedesk.ai.domain.model.ResolutionSuggestion;
import com.servicedesk.ai.domain.repository.DeflectionEventJpaRepository;
import com.servicedesk.ai.domain.repository.SearchHistoryJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Writes what the platform did, so it can later be asked what difference it made.
 *
 * Every method here is best-effort: telemetry must never break the request that
 * produced it. A failure to record a suggestion is logged and swallowed, because
 * losing a metric is preferable to losing the answer the agent was waiting for.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeflectionTelemetryService {

    private final DeflectionEventJpaRepository deflectionRepository;
    private final SearchHistoryJpaRepository searchHistoryRepository;

    /** Records a suggestion at the moment it is produced. */
    @Transactional
    public void recordSuggestion(ResolutionSuggestion suggestion, String category,
                                 String department, String callerEmail, long latencyMs) {
        try {
            deflectionRepository.save(DeflectionEventEntity.builder()
                .suggestionId(suggestion.getSuggestionId())
                .queryText(suggestion.getQueryTitle())
                .deflected(suggestion.isDeflectionSuccessful())
                .confidenceScore(suggestion.getConfidenceScore() != null
                    ? (double) suggestion.getConfidenceScore().value() : null)
                .resolutionSuggested(suggestion.getSummaryResolution())
                .category(category)
                .department(department)
                .sourcesCount(suggestion.getReferencedSources() != null
                    ? suggestion.getReferencedSources().size() : 0)
                .modelUsed(suggestion.getGeneratedByModel())
                .latencyMs(latencyMs)
                .callerEmail(callerEmail)
                .correlationId(suggestion.getCorrelationId())
                .createdAt(Instant.now())
                .build());
        } catch (Exception e) {
            log.warn("Could not record deflection telemetry for {}: {}",
                suggestion.getSuggestionId(), e.getMessage());
        }
    }

    /**
     * Attaches the agent's verdict to a suggestion already recorded.
     *
     * @param outcome SOLVED when the suggestion resolved the problem, CONTINUED when the
     *                agent raised the ticket anyway
     * @return false when the suggestion id is unknown, so the caller can say so
     */
    @Transactional
    public boolean recordOutcome(String suggestionId, String outcome) {
        Optional<DeflectionEventEntity> found = deflectionRepository.findBySuggestionId(suggestionId);
        if (found.isEmpty()) {
            log.warn("Feedback for unknown suggestion {}", suggestionId);
            return false;
        }
        DeflectionEventEntity event = found.get();
        event.setOutcome(outcome);
        event.setOutcomeAt(Instant.now());
        deflectionRepository.save(event);
        log.info("Suggestion {} marked {}", suggestionId, outcome);
        return true;
    }

    /** Records a knowledge search and how well the corpus answered it. */
    @Transactional
    public void recordSearch(String queryText, String department, String category,
                             int topK, int resultsReturned, Double topScore,
                             long latencyMs, String source) {
        try {
            searchHistoryRepository.save(SearchHistoryEntity.builder()
                .queryText(queryText)
                .department(department)
                .category(category)
                .topK(topK)
                .resultsReturned(resultsReturned)
                .topScore(topScore)
                .latencyMs(latencyMs)
                .source(source)
                .createdBy("anonymous")
                .createdAt(Instant.now())
                .build());
        } catch (Exception e) {
            log.warn("Could not record search history: {}", e.getMessage());
        }
    }
}
