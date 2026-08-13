package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "Health & Readiness", description = "System Diagnostic & Health Check Endpoints")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HealthController {

    private final EmbeddingPort embeddingPort;
    private final VectorDatabasePort vectorDatabasePort;
    private final ServiceNowPort serviceNowPort;

    @Operation(summary = "Platform health check and connectivity diagnostic")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "healthy");
        health.put("timestamp", Instant.now().toString());
        health.put("service", "AI Service Desk Knowledge Intelligence Platform");
        health.put("version", "2.5.0-SNAPSHOT");

        health.put("pineconeStatus", checkPinecone());
        health.put("servicenowStatus", checkServiceNow());

        return ResponseEntity.ok(health);
    }

    private String checkPinecone() {
        try {
            long count = vectorDatabasePort.countVectors("default");
            return "connected (vectors: " + count + ")";
        } catch (Exception e) {
            return "error: " + e.getMessage();
        }
    }

    private String checkServiceNow() {
        try {
            boolean ok = serviceNowPort.validateConnection();
            return ok ? "connected" : "unreachable";
        } catch (Exception e) {
            return "error: " + e.getMessage();
        }
    }
}
