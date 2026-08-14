package com.servicedesk.ai.analytics.model;

import lombok.Builder;

import java.time.Instant;

/**
 * @param ticketsDeflectedCount     suggestions that cleared the confidence threshold
 * @param confirmedResolutionsCount suggestions an agent confirmed actually solved the problem;
 *                                  this, not the deflected count, is what the savings figure
 *                                  is derived from once any feedback exists
 * @param uploadedDocumentsCount    documents uploaded through the API. Records synced from a
 *                                  connector go straight to the index and are not counted here,
 *                                  so this is not the size of the corpus - totalEmbeddingsCount is.
 */
@Builder
public record DeflectionMetrics(
    long totalIncidentsAnalyzed,
    long ticketsDeflectedCount,
    long confirmedResolutionsCount,
    double deflectionRatePercent,
    double monthlyCostSavingsUSD,
    long uploadedDocumentsCount,
    long totalEmbeddingsCount,
    double averageConfidenceScore,
    double averageResolutionTimeSeconds,
    Instant calculatedAt
) {
    /** The same figures with the vector count filled in by a caller that holds the vector port. */
    public DeflectionMetrics withTotalEmbeddings(long count) {
        return new DeflectionMetrics(
            totalIncidentsAnalyzed, ticketsDeflectedCount, confirmedResolutionsCount,
            deflectionRatePercent, monthlyCostSavingsUSD, uploadedDocumentsCount,
            count, averageConfidenceScore, averageResolutionTimeSeconds, calculatedAt);
    }
}
