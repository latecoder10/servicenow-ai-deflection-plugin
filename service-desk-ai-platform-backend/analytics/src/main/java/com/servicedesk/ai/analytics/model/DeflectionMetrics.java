package com.servicedesk.ai.analytics.model;

import lombok.Builder;

import java.time.Instant;

@Builder
public record DeflectionMetrics(
    long totalIncidentsAnalyzed,
    long ticketsDeflectedCount,
    double deflectionRatePercent,
    double monthlyCostSavingsUSD,
    long knowledgeBaseDocumentsCount,
    long totalEmbeddingsCount,
    double averageConfidenceScore,
    double averageResolutionTimeSeconds,
    Instant calculatedAt
) {}
