package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.DocumentSourceType;
import com.servicedesk.ai.loader.chunking.ChunkingEngine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Tag(name = "Knowledge Base Management", description = "Document Ingestion, Chunking & Vector Indexing")
@RestController
@RequestMapping("/api/v1/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final ChunkingEngine chunkingEngine;

    @Operation(summary = "Ingest document for vector indexing")
    @PostMapping("/documents")
    public ResponseEntity<DocumentMetadata> ingestDocument(@RequestBody Map<String, String> body) {
        String title = body.getOrDefault("title", "Enterprise Runbook");
        String department = body.getOrDefault("department", "IT Operations");
        String category = body.getOrDefault("category", "Infrastructure");

        DocumentMetadata metadata = DocumentMetadata.builder()
            .documentId("doc-" + UUID.randomUUID().toString().substring(0, 8))
            .title(title)
            .sourceType(DocumentSourceType.PDF)
            .department(department)
            .category(category)
            .ownerEmail("admin@enterprise.com")
            .tags(Set.of("Runbook", "Production"))
            .version("1.0")
            .createdDate(Instant.now())
            .lastIndexedDate(Instant.now())
            .build();

        return ResponseEntity.ok(metadata);
    }

    @Operation(summary = "List all indexed knowledge documents")
    @GetMapping("/documents")
    public ResponseEntity<List<DocumentMetadata>> listDocuments() {
        return ResponseEntity.ok(List.of(
            DocumentMetadata.builder()
                .documentId("doc-okta-sso")
                .title("Okta SSO Multi-Factor Authentication Reset Runbook")
                .sourceType(DocumentSourceType.SERVICENOW_KB)
                .department("Identity & Access")
                .category("Authentication")
                .version("v2.4")
                .createdDate(Instant.now().minusSeconds(86400 * 5))
                .lastIndexedDate(Instant.now())
                .build(),
            DocumentMetadata.builder()
                .documentId("doc-vpn-global")
                .title("GlobalProtect VPN Tunnel Disconnection & Certificate Renewal SOP")
                .sourceType(DocumentSourceType.CONFLUENCE_PAGE)
                .department("Network Infrastructure")
                .category("VPN")
                .version("v3.1")
                .createdDate(Instant.now().minusSeconds(86400 * 12))
                .lastIndexedDate(Instant.now())
                .build()
        ));
    }
}
