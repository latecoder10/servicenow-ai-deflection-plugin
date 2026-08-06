package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.application.service.SyntheticDataLoader;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import com.servicedesk.ai.domain.util.KnowledgeRecordUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "Knowledge Base Management", description = "Pinecone Semantic Knowledge Index Explorer, Search & Maintenance")
@RestController
@RequestMapping("/api/v1/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final VectorDatabasePort vectorDatabasePort;
    private final EmbeddingPort embeddingPort;
    private final com.servicedesk.ai.domain.port.out.ServiceNowPort serviceNowPort;
    private final SyntheticDataLoader syntheticDataLoader;

    @Operation(summary = "Semantic Search across synchronized ServiceNow Knowledge Index")
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchKnowledgeIndex(
            @RequestParam(name = "query") String query,
            @RequestParam(name = "workspace", required = false) String workspace,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "topK", defaultValue = "5") int topK) {

        List<Float> queryVector = embeddingPort.generateEmbedding(query);
        var searchResults = vectorDatabasePort.similaritySearch(AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE, queryVector, topK, workspace, category);

        return ResponseEntity.ok(Map.of(
            "query", query,
            "workspace", workspace != null ? workspace : "All Workspaces",
            "category", category != null ? category : "All Categories",
            "topK", topK,
            "results", searchResults
        ));
    }

    @Operation(summary = "List synchronized Knowledge Records (Incidents & KB Articles)")
    @GetMapping("/records")
    public ResponseEntity<List<KnowledgeRecord>> listSynchronizedRecords(
            @RequestParam(name = "daysBack", defaultValue = "30") int daysBack,
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset) {
        List<KnowledgeRecord> records = serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(Instant.now().minus(daysBack, ChronoUnit.DAYS), limit, offset);
        return ResponseEntity.ok(records);
    }

    @Operation(summary = "Re-index a single record in Pinecone")
    @PostMapping("/records/{recordSysId}/reindex")
    public ResponseEntity<Map<String, Object>> reindexRecord(@PathVariable(name = "recordSysId") String recordSysId) {
        KnowledgeRecord record = serviceNowPort.getKnowledgeRecordBySysId(recordSysId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found in ServiceNow"));

        String textPayload = KnowledgeRecordUtils.buildTextPayload(record);
        Map<String, Object> metadata = KnowledgeRecordUtils.buildMetadata(record);
        
        List<Float> embedding = embeddingPort.generateEmbedding(textPayload);

        vectorDatabasePort.upsertVector(AppConstants.VECTOR_ID_PREFIX + recordSysId + AppConstants.VECTOR_ID_SEPARATOR + "0", embedding, metadata, textPayload);

        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "recordSysId", recordSysId,
            "message", "Record vector re-embedded and upserted into Pinecone index 'servicedesk-knowledge'"
        ));
    }

    @Operation(summary = "Remove vector chunk from Pinecone index")
    @DeleteMapping("/records/{recordSysId}")
    public ResponseEntity<Map<String, Object>> deleteRecordFromIndex(@PathVariable(name = "recordSysId") String recordSysId) {
        vectorDatabasePort.deleteVector(AppConstants.VECTOR_ID_PREFIX + recordSysId + AppConstants.VECTOR_ID_SEPARATOR + "0");
        return ResponseEntity.ok(Map.of(
            "status", "DELETED",
            "vectorId", AppConstants.VECTOR_ID_PREFIX + recordSysId + AppConstants.VECTOR_ID_SEPARATOR + "0",
            "message", "Vector chunk purged from Pinecone index"
        ));
    }

    @Operation(summary = "Load synthetic IT support tickets into ServiceNow as resolved incidents")
    @PostMapping("/load-synthetic")
    public ResponseEntity<Map<String, Object>> loadSyntheticData() {
        SyntheticDataLoader.LoadResult result = syntheticDataLoader.pushIncidentsToServiceNow();
        return ResponseEntity.ok(Map.of(
            "status", result.failed() > 0 ? "COMPLETED_WITH_ERRORS" : "SUCCESS",
            "created", result.created(),
            "resolved", result.resolved(),
            "failed", result.failed(),
            "durationMs", result.durationMs(),
            "message", String.format("Pushed %d incidents to ServiceNow (%d resolved)", result.created(), result.resolved())
        ));
    }
}
