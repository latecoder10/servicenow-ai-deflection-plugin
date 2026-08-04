package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.domain.model.Incident;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "ServiceNow Integration", description = "ServiceNow REST Incident & Knowledge Management")
@RestController
@RequestMapping("/api/v1/servicenow")
@RequiredArgsConstructor
public class ServiceNowController {

    private final ServiceNowPort serviceNowPort;

    @Operation(summary = "Create ServiceNow Incident if AI deflection fails or is declined")
    @PostMapping("/incidents")
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident) {
        Incident created = serviceNowPort.createIncident(incident);
        return ResponseEntity.ok(created);
    }

    @Operation(summary = "Test and validate connection health to ServiceNow Instance")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkConnection() {
        boolean healthy = serviceNowPort.validateConnection();
        return ResponseEntity.ok(Map.of(
            "status", healthy ? "CONNECTED" : "DISCONNECTED",
            "instance", "https://enterprise.service-now.com",
            "authMode", "OAuth2.0 Bearer"
        ));
    }
}
