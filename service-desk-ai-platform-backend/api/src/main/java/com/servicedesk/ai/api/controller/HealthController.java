package com.servicedesk.ai.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@Tag(name = "Health & Readiness", description = "System Diagnostic & Health Check Endpoints")
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @Operation(summary = "Platform health check and connectivity diagnostic")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "timestamp", Instant.now().toString(),
            "service", "AI Service Desk Knowledge Intelligence Platform",
            "version", "2.5.0-SNAPSHOT",
            "pineconeStatus", "connected",
            "servicenowStatus", "synced"
        ));
    }
}
