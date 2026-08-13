package com.servicedesk.ai.analytics.service;

import com.servicedesk.ai.analytics.model.DeflectionMetrics;
import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.repository.KnowledgeDocumentJpaRepository;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
public class DeflectionAnalyticsService {

    private final AtomicLong totalAnalyzed = new AtomicLong(0);
    private final AtomicLong deflectedCount = new AtomicLong(0);
    private final Counter deflectionCounter;
    private final KnowledgeDocumentJpaRepository documentRepository;
    private final SyncJobJpaRepository syncJobRepository;

    public DeflectionAnalyticsService(
        MeterRegistry registry,
        KnowledgeDocumentJpaRepository documentRepository,
        SyncJobJpaRepository syncJobRepository
    ) {
        this.deflectionCounter = Counter.builder("servicedesk.ai.deflections.total")
            .description("Total number of successfully deflected ServiceNow incidents")
            .register(registry);
        this.documentRepository = documentRepository;
        this.syncJobRepository = syncJobRepository;
    }

    public void recordDeflectionEvent(boolean successful) {
        totalAnalyzed.incrementAndGet();
        if (successful) {
            deflectedCount.incrementAndGet();
            deflectionCounter.increment();
        }
    }

    public DeflectionMetrics computeCurrentMetrics() {
        long analyzed = totalAnalyzed.get();
        long deflected = deflectedCount.get();
        double rate = analyzed > 0 ? (deflected * 100.0) / analyzed : 0.0;
        double savingsUSD = deflected * 15.50;

        long docCount = 0;
        long syncCount = 0;
        try {
            docCount = documentRepository.count();
        } catch (Exception e) {
            log.warn("Failed to count knowledge documents: {}", e.getMessage());
        }
        try {
            List<SyncJobEntity> recentJobs = syncJobRepository.findTop10ByOrderByStartedAtDesc();
            syncCount = recentJobs.stream()
                .filter(j -> "COMPLETED".equals(j.getStatus()) || "COMPLETED_WITH_ERRORS".equals(j.getStatus()))
                .mapToLong(SyncJobEntity::getItemsFetched)
                .sum();
        } catch (Exception e) {
            log.warn("Failed to count sync items: {}", e.getMessage());
        }

        return DeflectionMetrics.builder()
            .totalIncidentsAnalyzed(analyzed)
            .ticketsDeflectedCount(deflected)
            .deflectionRatePercent(Math.round(rate * 10.0) / 10.0)
            .monthlyCostSavingsUSD(savingsUSD)
            .knowledgeBaseDocumentsCount(docCount)
            .totalEmbeddingsCount(syncCount)
            .averageConfidenceScore(0.0)
            .averageResolutionTimeSeconds(0.0)
            .calculatedAt(Instant.now())
            .build();
    }
}
