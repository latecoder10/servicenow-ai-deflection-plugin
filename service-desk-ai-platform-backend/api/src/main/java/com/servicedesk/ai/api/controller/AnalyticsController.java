package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.analytics.model.DeflectionMetrics;
import com.servicedesk.ai.analytics.service.DeflectionAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Analytics & ROI Metrics", description = "Deflection Rate, Cost Savings & Coverage Analytics")
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final DeflectionAnalyticsService analyticsService;

    @Operation(summary = "Get current ROI, Deflection Rate, and Metrics Dashboard data")
    @GetMapping("/deflection")
    public ResponseEntity<DeflectionMetrics> getDeflectionMetrics() {
        return ResponseEntity.ok(analyticsService.computeCurrentMetrics());
    }
}
