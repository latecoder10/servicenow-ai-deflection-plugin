package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.application.service.IndexedDocumentCatalog;
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
@lombok.extern.slf4j.Slf4j
public class KnowledgeController {

    private final VectorDatabasePort vectorDatabasePort;
    private final EmbeddingPort embeddingPort;
    private final com.servicedesk.ai.domain.port.out.ServiceNowPort serviceNowPort;
    private final SyntheticDataLoader syntheticDataLoader;
    private final IndexedDocumentCatalog catalog;
    private final com.servicedesk.ai.domain.repository.KnowledgeDocumentJpaRepository documentRepository;

    /** Beyond this a query costs more than it returns, and Pinecone rejects very large values. */
    private static final int MAX_TOP_K = 50;

    /** Guards the synthetic seeder, which writes fabricated tickets into a real instance. */
    @org.springframework.beans.factory.annotation.Value("${knowledge.synthetic-data.enabled:false}")
    private boolean syntheticDataEnabled;

    @Operation(summary = "Semantic Search across the synchronized knowledge index")
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchKnowledgeIndex(
            @RequestParam(name = "query") String query,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "topK", defaultValue = "5") int topK) {

        if (query.isBlank()) {
            throw new IllegalArgumentException("Parameter 'query' must not be blank");
        }
        // Clamp rather than reject: a caller asking for 1000 wants "as many as you have".
        int effectiveTopK = Math.max(1, Math.min(topK, MAX_TOP_K));

        List<Float> queryVector = embeddingPort.generateEmbedding(query);
        var searchResults = vectorDatabasePort.similaritySearch(
            AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE, queryVector, effectiveTopK, department, category);

        // department, not workspace: the filter matches the department metadata field, and
        // passing a workspace value here silently matched nothing.
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("query", query);
        body.put("department", department != null ? department : "All Departments");
        body.put("category", category != null ? category : "All Categories");
        body.put("topK", effectiveTopK);
        if (effectiveTopK != topK) {
            body.put("note", "topK was clamped to the permitted range 1-" + MAX_TOP_K);
        }
        body.put("resultCount", searchResults.size());
        body.put("results", searchResults);
        return ResponseEntity.ok(body);
    }

    @Operation(summary = "List synchronized Knowledge Records (Incidents & KB Articles)")
    @GetMapping("/records")
    public ResponseEntity<List<KnowledgeRecord>> listSynchronizedRecords(
            @RequestParam(name = "daysBack", defaultValue = "30") int daysBack,
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            @RequestParam(name = "offset", defaultValue = "0") int offset) {

        // Negative values reach the ServiceNow API as nonsense query parameters, and an
        // unbounded limit pulls the whole table into memory, so they are clamped here.
        int safeDaysBack = Math.max(1, Math.min(daysBack, 3650));
        int safeLimit = Math.max(1, Math.min(limit, 500));
        int safeOffset = Math.max(0, offset);

        List<KnowledgeRecord> records = serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(
            Instant.now().minus(safeDaysBack, ChronoUnit.DAYS), safeLimit, safeOffset);
        return ResponseEntity.ok(records);
    }

    /**
     * What Postgres believes is in the index.
     *
     * <p>Reconciling this against the vector count is the point: a document catalogued
     * but absent from Pinecone, or present in Pinecone with no row here, is drift that
     * was previously invisible because nothing recorded synced records at all.
     */
    @Operation(summary = "List indexed documents recorded in the Postgres catalogue")
    @GetMapping("/catalog")
    public ResponseEntity<Map<String, Object>> listCatalogue(
            @RequestParam(name = "connectorType", required = false) String connectorType,
            @RequestParam(name = "limit", defaultValue = "50") int limit) {

        int safeLimit = Math.max(1, Math.min(limit, 500));

        List<com.servicedesk.ai.domain.entity.KnowledgeDocumentEntity> documents =
            connectorType != null && !connectorType.isBlank()
                ? documentRepository.findByConnectorTypeAndSoftDeleteFalse(connectorType.toUpperCase())
                : documentRepository.findAll().stream()
                    .filter(d -> !Boolean.TRUE.equals(d.getSoftDelete()))
                    .toList();

        List<Map<String, Object>> rows = documents.stream()
            .sorted(java.util.Comparator.comparing(
                com.servicedesk.ai.domain.entity.KnowledgeDocumentEntity::getLastIndexedAt,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
            .limit(safeLimit)
            .map(d -> {
                Map<String, Object> row = new java.util.LinkedHashMap<>();
                row.put("documentId", d.getId());
                row.put("connectorType", d.getConnectorType());
                row.put("externalNumber", d.getExternalNumber());
                row.put("externalId", d.getExternalId());
                row.put("title", d.getTitle());
                row.put("sourceType", d.getSourceType());
                row.put("sourceUri", d.getSourceUri());
                row.put("department", d.getDepartmentName());
                row.put("category", d.getCategoryName());
                row.put("vectorDocumentId", d.getVectorDocumentId());
                row.put("chunkCount", d.getChunkCount());
                row.put("status", d.getStatus());
                row.put("lastIndexedAt", d.getLastIndexedAt());
                return row;
            })
            .toList();

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("connectorType", connectorType != null ? connectorType.toUpperCase() : "All Connectors");
        body.put("documentCount", rows.size());
        body.put("chunkTotal", rows.stream()
            .mapToInt(r -> r.get("chunkCount") == null ? 0 : (Integer) r.get("chunkCount")).sum());
        body.put("vectorsInIndex",
            vectorDatabasePort.countVectors(AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE));
        body.put("documents", rows);
        return ResponseEntity.ok(body);
    }

    @Operation(summary = "Re-embed and re-index a single record")
    @PostMapping("/records/{recordSysId}/reindex")
    public ResponseEntity<Map<String, Object>> reindexRecord(@PathVariable(name = "recordSysId") String recordSysId) {
        KnowledgeRecord record = serviceNowPort.getKnowledgeRecordBySysId(recordSysId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Record " + recordSysId + " was not found in ServiceNow"));

        String textPayload = KnowledgeRecordUtils.buildTextPayload(record);
        Map<String, Object> metadata = KnowledgeRecordUtils.buildMetadata(record);
        String documentId = AppConstants.VECTOR_ID_PREFIX + recordSysId;

        // Clear first. A record that has shrunk since the last sync would otherwise keep
        // its surplus chunks, leaving stale text searchable under the same document.
        vectorDatabasePort.deleteByDocumentId(AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE, documentId);

        // Chunk exactly as the sync pipeline does, so a reindexed record is
        // indistinguishable from a freshly synced one.
        List<String> textChunks = com.servicedesk.ai.domain.util.TextChunker.chunkText(
            textPayload, AppConstants.CHUNK_SIZE_CHARS, AppConstants.CHUNK_OVERLAP_CHARS);

        // Same denylist as the sync path: keys carried as first-class metadata below
        // would otherwise be written twice under the same name.
        Map<String, String> provenance = new java.util.LinkedHashMap<>();
        metadata.forEach((k, v) -> {
            if (AppConstants.META_TITLE.equals(k)
                || AppConstants.META_CATEGORY.equals(k)
                || AppConstants.META_DEPARTMENT.equals(k)
                || AppConstants.META_SOURCE_TYPE.equals(k)) {
                return;
            }
            if (v != null && !String.valueOf(v).isBlank()) {
                provenance.put(k, String.valueOf(v));
            }
        });

        List<com.servicedesk.ai.domain.model.KnowledgeChunk> chunks = new java.util.ArrayList<>();
        for (int i = 0; i < textChunks.size(); i++) {
            String chunkText = textChunks.get(i);
            chunks.add(com.servicedesk.ai.domain.model.KnowledgeChunk.builder()
                .chunkId(documentId + AppConstants.VECTOR_ID_SEPARATOR + i)
                .documentId(documentId)
                .chunkIndex(i)
                .textContent(chunkText)
                .tokenCount(com.servicedesk.ai.domain.util.TextChunker.estimateTokens(chunkText))
                .vectorEmbedding(embeddingPort.generateEmbedding(chunkText))
                .metadata(com.servicedesk.ai.domain.model.DocumentMetadata.builder()
                    .documentId(documentId)
                    .title((String) metadata.get(AppConstants.META_TITLE))
                    .category((String) metadata.get(AppConstants.META_CATEGORY))
                    .department((String) metadata.get(AppConstants.META_DEPARTMENT))
                    .sourceType(KnowledgeRecordUtils.sourceTypeFor(record.getRecordType()))
                    .sourceUri(record.getSourceUrl())
                    .customAttributes(provenance)
                    .createdDate(record.getSysUpdatedOn() != null ? record.getSysUpdatedOn() : Instant.now())
                    .build())
                .build());
        }

        // Same collection the delete above and every search use. This said
        // COLLECTION_SERVICENOW, which only went unnoticed because the adapter ignores
        // the argument and derives the namespace from the document's date.
        int upserted = vectorDatabasePort.upsertChunks(
            AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE, chunks);

        // Catalogued exactly as the sync path does, so a reindexed record is
        // indistinguishable from a freshly synced one in Postgres as well as in Pinecone.
        boolean catalogued = true;
        try {
            catalog.recordIndexedDocument(IndexedDocumentCatalog.Entry.builder()
                .connectorType(AppConstants.CONNECTOR_SERVICENOW)
                .externalId(recordSysId)
                .externalNumber(record.getRecordNumber())
                .vectorDocumentId(documentId)
                .title(record.getTitle())
                .sourceType(KnowledgeRecordUtils.sourceTypeFor(record.getRecordType()).name())
                .sourceUri(record.getSourceUrl())
                .department(record.getDepartment())
                .category(record.getCategory())
                .ownerEmail(record.getOwnerEmail())
                .recordedBy("reindex-api")
                .build(), chunks);
        } catch (Exception e) {
            // The vectors are already written, so this is reported, not thrown.
            catalogued = false;
            log.warn("Reindexed {} but could not catalogue it: {}", recordSysId, e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "recordSysId", recordSysId,
            "documentId", documentId,
            "chunksIndexed", upserted,
            // Reported rather than hidden: the record is searchable either way, but a
            // caller reconciling Postgres against the index needs to know it is behind.
            "catalogued", catalogued,
            "message", catalogued
                ? "Record re-embedded and re-indexed"
                : "Record re-embedded and re-indexed, but the Postgres catalogue was not updated"
        ));
    }

    @Operation(summary = "Remove every vector chunk for a record from the index")
    @DeleteMapping("/records/{recordSysId}")
    public ResponseEntity<Map<String, Object>> deleteRecordFromIndex(@PathVariable(name = "recordSysId") String recordSysId) {
        // A long record is split into several chunks. Deleting only "<id>-0" would leave
        // the remainder searchable, so the delete is by documentId across all of them.
        String documentId = AppConstants.VECTOR_ID_PREFIX + recordSysId;
        vectorDatabasePort.deleteByDocumentId(AppConstants.COLLECTION_SERVICESK_DESK_KNOWLEDGE, documentId);

        // Keep the catalogue honest. Without this it would go on claiming the record is
        // indexed after its vectors are gone.
        boolean wasCatalogued = false;
        try {
            wasCatalogued = catalog.markRemoved(
                AppConstants.CONNECTOR_SERVICENOW, recordSysId, "delete-api");
        } catch (Exception e) {
            log.warn("Purged {} from the index but could not update the catalogue: {}",
                recordSysId, e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "status", "DELETED",
            "documentId", documentId,
            "catalogueUpdated", wasCatalogued,
            "message", "All vector chunks for this record were purged from the index"
        ));
    }

    /**
     * Writes fabricated incidents into the connected ServiceNow instance. Useful for
     * seeding a demo, unacceptable in production, so it is disabled unless explicitly
     * switched on.
     */
    @Operation(summary = "Seed the connected instance with synthetic resolved incidents (non-production only)")
    @PostMapping("/load-synthetic")
    public ResponseEntity<Map<String, Object>> loadSyntheticData() {
        if (!syntheticDataEnabled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Synthetic data loading is disabled. Set knowledge.synthetic-data.enabled=true "
                    + "to allow it, and never in an instance holding real tickets.");
        }
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
