package com.servicedesk.ai.integration.llm;

import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Orders retrieved chunks before they are handed to the LLM.
 *
 * Semantic similarity alone treats a critical incident resolved last week and a
 * low-priority one from three years ago as equally good answers. This blends the
 * vector score with how urgent the source record was and how recent it is, so
 * current, high-priority guidance surfaces first.
 *
 * Similarity stays dominant: the boosts adjust the order of comparable matches,
 * they do not promote an irrelevant chunk above a relevant one.
 */
@Slf4j
@Component
public class RerankingEngine {

    /** Multiplier applied at ServiceNow priority 1; scales to zero by priority 5. */
    @Value("${ai.ranking.priority-weight:0.15}")
    private double priorityWeight;

    /** Multiplier applied to a current-year record; decays with age. */
    @Value("${ai.ranking.recency-weight:0.10}")
    private double recencyWeight;

    /** Age in years at which the recency boost reaches zero. */
    @Value("${ai.ranking.recency-horizon-years:5}")
    private int recencyHorizonYears;

    public List<KnowledgeChunk> rerankChunks(String queryText, List<KnowledgeChunk> candidateChunks, int topN) {
        if (candidateChunks == null || candidateChunks.isEmpty()) {
            return List.of();
        }

        int currentYear = Year.now().getValue();

        List<KnowledgeChunk> sorted = candidateChunks.stream()
            .sorted(Comparator.comparingDouble((KnowledgeChunk c) -> weightedScore(c, currentYear)).reversed())
            .limit(topN)
            .toList();

        if (log.isDebugEnabled() && !sorted.isEmpty()) {
            KnowledgeChunk top = sorted.get(0);
            log.debug("[Reranker] {} candidates to top {}; leader similarity={} weighted={}",
                candidateChunks.size(), sorted.size(),
                String.format("%.4f", top.getRelevanceScore()),
                String.format("%.4f", weightedScore(top, currentYear)));
        } else {
            log.info("[Reranker] Reranking {} candidate chunks down to top {}", candidateChunks.size(), topN);
        }

        return sorted;
    }

    private double weightedScore(KnowledgeChunk chunk, int currentYear) {
        double similarity = chunk.getRelevanceScore();
        return similarity * (1.0 + priorityBoost(chunk) + recencyBoost(chunk, currentYear));
    }

    /**
     * ServiceNow priority runs 1 (critical) to 5 (planning), and arrives as a
     * display value such as "1 - Critical". Priority 1 earns the full weight,
     * priority 5 earns nothing.
     */
    private double priorityBoost(KnowledgeChunk chunk) {
        Integer priority = parseLeadingInt(attribute(chunk, AppConstants.META_PRIORITY));
        if (priority == null || priority < 1 || priority > 5) {
            return 0.0;
        }
        return priorityWeight * ((5 - priority) / 4.0);
    }

    /** Linear decay from the full weight this year to nothing at the horizon. */
    private double recencyBoost(KnowledgeChunk chunk, int currentYear) {
        Integer year = parseLeadingInt(attribute(chunk, AppConstants.META_YEAR));
        if (year == null || recencyHorizonYears <= 0) {
            return 0.0;
        }
        int age = currentYear - year;
        if (age < 0) {
            age = 0;   // clock skew or a future-dated record
        }
        if (age >= recencyHorizonYears) {
            return 0.0;
        }
        return recencyWeight * (1.0 - ((double) age / recencyHorizonYears));
    }

    private String attribute(KnowledgeChunk chunk, String key) {
        DocumentMetadata meta = chunk.getMetadata();
        if (meta == null) {
            return null;
        }
        Map<String, String> attrs = meta.customAttributes();
        return attrs == null ? null : attrs.get(key);
    }

    private Integer parseLeadingInt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        int end = 0;
        String trimmed = value.trim();
        while (end < trimmed.length() && Character.isDigit(trimmed.charAt(end))) {
            end++;
        }
        if (end == 0) {
            return null;
        }
        try {
            return Integer.parseInt(trimmed.substring(0, end));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
