package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.analytics.model.DeflectionMetrics;
import com.servicedesk.ai.analytics.service.DeflectionAnalyticsService;
import com.servicedesk.ai.domain.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowConfig;

import java.util.List;
import java.util.Map;

@Tag(name = "Analytics & ROI Metrics", description = "Deflection Rate, Knowledge Synchronization Growth, ROI & Executive Dashboard Analytics")
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
        return ResponseEntity.ok(analyticsService.computeCurrentMetrics());
    }

    @Operation(summary = "Get Full Executive Synchronization & AI Knowledge Layer Metrics Dashboard")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getFullDashboardMetrics() {
        DeflectionMetrics deflection = analyticsService.computeCurrentMetrics();
        
        List<SyncJobEntity> recentJobs = syncJobRepository.findTop10ByOrderByStartedAtDesc();
        String lastSyncTime = recentJobs.isEmpty() ? "Never" : recentJobs.get(0).getStartedAt().toString();

        long pineconeCount = 0;
        try {
            pineconeCount = vectorDatabasePort.countVectors(AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE);
        } catch (Exception e) {
            // Ignore if index doesn't exist yet
        }

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
                "deflectionRatePercent", deflection.deflectionRatePercent(),
                "monthlyCostSavingsUSD", deflection.monthlyCostSavingsUSD()
            )
        ));
    }
}
