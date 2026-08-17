package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.analytics.model.DeflectionMetrics;
import com.servicedesk.ai.analytics.service.DeflectionAnalyticsService;
import com.servicedesk.ai.domain.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowConfig;

import java.util.List;
import java.util.Map;

@Tag(name = "Analytics & ROI Metrics", description = "Deflection Rate, Knowledge Synchronization Growth, ROI & Executive Dashboard Analytics")
@Slf4j
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final DeflectionAnalyticsService analyticsService;
    private final VectorDatabasePort vectorDatabasePort;
    private final ServiceNowPort serviceNowPort;
    private final ServiceNowConfig serviceNowConfig;
    private final SyncJobJpaRepository syncJobRepository;

    @Operation(summary = "Get current ROI, Deflection Rate, and Metrics Dashboard data")
    @GetMapping("/deflection")
    public ResponseEntity<DeflectionMetrics> getDeflectionMetrics() {
        // The analytics module has no vector port, so the corpus size is filled in here.
        // Left unset, this endpoint reported an index of zero however much was indexed.
        return ResponseEntity.ok(analyticsService.computeCurrentMetrics().withTotalEmbeddings(vectorCount()));
    }

    /**
     * Size of the live index.
     *
     * A missing index is expected before the first sync, but an auth or network failure
     * looks identical on the dashboard, so it is at least logged.
     */
    private long vectorCount() {
        try {
            return vectorDatabasePort.countVectors(AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE);
        } catch (Exception e) {
            log.warn("Could not read the vector count: {}", e.getMessage());
            return 0L;
        }
    }

    /**
     * Deflection rate over time, for the dashboard trend chart.
     *
     * <p>Hourly is offered because a freshly seeded instance has only one day of
     * telemetry, where a daily series is a single point and reads as broken.
     */
    @Operation(summary = "Deflection rate over time, bucketed by day or hour")
    @GetMapping("/deflection-trend")
    public ResponseEntity<Map<String, Object>> getDeflectionTrend(
            @RequestParam(name = "windowDays", defaultValue = "30") int windowDays,
            @RequestParam(name = "granularity", defaultValue = "DAY") String granularity) {
        return ResponseEntity.ok(analyticsService.deflectionTrend(windowDays, granularity));
    }

    @Operation(summary = "Questions the knowledge base answers badly or not at all")
    @GetMapping("/knowledge-gaps")
    public ResponseEntity<Map<String, Object>> getKnowledgeGaps(
            @RequestParam(name = "windowDays", defaultValue = "30") int windowDays,
            @RequestParam(name = "minOccurrences", defaultValue = "2") long minOccurrences) {
        return ResponseEntity.ok(analyticsService.knowledgeGaps(
            Math.max(1, Math.min(windowDays, 365)), Math.max(1, minOccurrences)));
    }

    @Operation(summary = "The most frequently asked questions in a window")
    @GetMapping("/top-questions")
    public ResponseEntity<Map<String, Object>> getTopQuestions(
            @RequestParam(name = "windowDays", defaultValue = "30") int windowDays,
            @RequestParam(name = "limit", defaultValue = "20") int limit) {

        int safeWindow = Math.max(1, Math.min(windowDays, 365));
        int safeLimit = Math.max(1, Math.min(limit, 100));

        return ResponseEntity.ok(Map.of(
            "windowDays", safeWindow,
            "questions", analyticsService.topQuestions(safeWindow, safeLimit)
        ));
    }

    @Operation(summary = "Get Full Executive Synchronization & AI Knowledge Layer Metrics Dashboard")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getFullDashboardMetrics() {
        DeflectionMetrics deflection = analyticsService.computeCurrentMetrics();
        
        List<SyncJobEntity> recentJobs = syncJobRepository.findTop10ByOrderByStartedAtDesc();
        // A job row can exist with no start time, and calling toString on it took the
        // whole dashboard down with a 500.
        String lastSyncTime = recentJobs.isEmpty() || recentJobs.get(0).getStartedAt() == null
            ? "Never"
            : recentJobs.get(0).getStartedAt().toString();

        long pineconeCount = vectorCount();

        return ResponseEntity.ok(Map.of(
            "serviceNowConnection", Map.of(
                "status", serviceNowPort.validateConnection() ? "CONNECTED" : "DISCONNECTED",
                "instanceUrl", serviceNowConfig.getInstanceUrl(),
                "authType", serviceNowConfig.getAuthMode(),
                "lastSyncTimestamp", lastSyncTime
            ),
            "knowledgeIndexStats", Map.of(
                "totalEmbeddingsInPinecone", pineconeCount,
                "activePineconeIndex", AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE
            ),
            "deflectionMetrics", Map.of(
                "totalIncidentsAnalyzed", deflection.totalIncidentsAnalyzed(),
                "ticketsDeflectedCount", deflection.ticketsDeflectedCount(),
                "confirmedResolutionsCount", deflection.confirmedResolutionsCount(),
                "deflectionRatePercent", deflection.deflectionRatePercent(),
                "monthlyCostSavingsUSD", deflection.monthlyCostSavingsUSD()
            )
        ));
    }
}
