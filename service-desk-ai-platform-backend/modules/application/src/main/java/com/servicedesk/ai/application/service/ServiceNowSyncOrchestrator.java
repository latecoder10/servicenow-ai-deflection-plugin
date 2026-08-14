package com.servicedesk.ai.application.service;

import com.servicedesk.ai.application.port.in.SyncServiceNowUseCase;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.entity.ConnectorConfigurationEntity;
import com.servicedesk.ai.domain.repository.ConnectorConfigurationJpaRepository;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import com.servicedesk.ai.domain.util.KnowledgeRecordUtils;

/**
 * Orchestrates the full ServiceNow synchronization workflow:
 * 1. Determine sync window (incremental vs full)
 * 2. Fetch changed records from ServiceNow
 * 3. Build semantic text payloads
 * 4. Upsert to Pinecone with rich metadata
 * 5. Persist sync job record to PostgreSQL
 * 6. Return execution summary
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceNowSyncOrchestrator implements SyncServiceNowUseCase {

    private final ServiceNowPort serviceNowPort;
    private final VectorDatabasePort vectorDatabasePort;
    private final EmbeddingPort embeddingPort;
    private final SyncJobJpaRepository syncJobRepository;
    private final ConnectorConfigurationJpaRepository connectorRepository;
    private final IndexedDocumentCatalog catalog;

    /**
     * Re-applied to the stored watermark so a record saved while a sync was running is
     * picked up next time rather than falling through the gap between runs.
     */
    private static final long WATERMARK_OVERLAP_SECONDS = 300;

    /**
     * Deliberately not transactional. The run calls an embedding API and a vector
     * database for every record, and wrapping that in one transaction held a database
     * connection for the whole sync. Each stage commits its own progress instead, which
     * also makes the job row visible while the sync is still running.
     */
    @Override
    public Result sync(Command command) {
        long startTime = System.currentTimeMillis();
        String jobId = "sync-" + UUID.randomUUID().toString().substring(0, 8);
        int limit = AppConstants.DEFAULT_BATCH_LIMIT;

        // A caller-supplied time wins, then the watermark from the last successful run.
        // Falling back to a fixed lookback on every run re-fetched and re-embedded the
        // same records each time, and lost anything changed while the service was down
        // for longer than that window.
        Instant since;
        if (command.forceFullSync()) {
            since = Instant.EPOCH;
        } else if (command.syncFromTime() != null) {
            since = command.syncFromTime();
        } else {
            since = storedWatermark().orElse(Instant.EPOCH);
        }

        log.info("[ServiceNow Sync] Starting sync, jobId={}, entityType={}, since={}", jobId, command.entityType(), since);

        // Persist job start
        SyncJobEntity jobEntity = SyncJobEntity.builder()
            .jobId(jobId)
            .connectorType(AppConstants.CONNECTOR_SERVICENOW)
            .syncType(command.forceFullSync() ? "FULL" : "INCREMENTAL")
            .status(AppConstants.STATUS_RUNNING)
            .startedAt(LocalDateTime.now())
            .build();
        syncJobRepository.save(jobEntity);

        int created = 0;
        int failed = 0;
        int offset = 0;
        int totalFetched = 0;
        Instant newestIndexed = null;
        Instant oldestFailure = null;

        try {
            while (true) {
                List<KnowledgeRecord> records = serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(since, limit, offset);
                log.info("[ServiceNow Sync] Fetched {} records from ServiceNow at offset {}", records.size(), offset);

                if (records.isEmpty()) {
                    break;
                }

                totalFetched += records.size();
                jobEntity.setItemsFetched(totalFetched);

            for (KnowledgeRecord record : records) {
                try {
                    String textPayload = KnowledgeRecordUtils.buildTextPayload(record);
                    Map<String, Object> metadata = KnowledgeRecordUtils.buildMetadata(record);
                    
                    List<String> textChunks = com.servicedesk.ai.domain.util.TextChunker.chunkText(textPayload, AppConstants.CHUNK_SIZE_CHARS, AppConstants.CHUNK_OVERLAP_CHARS);
                    List<com.servicedesk.ai.domain.model.KnowledgeChunk> knowledgeChunks = new ArrayList<>();
                    
                    for (int i = 0; i < textChunks.size(); i++) {
                        String chunkText = textChunks.get(i);
                        List<Float> embedding = embeddingPort.generateEmbedding(chunkText);
                        
                        // Carry provenance through to the vector index so a retrieved
                        // chunk can be cited back to the record it came from.
                        // Carry everything buildMetadata produced except the three keys that
                        // are already first-class fields below. A denylist rather than an
                        // allowlist: a new key added to buildMetadata should reach the index
                        // automatically instead of being silently dropped here, which is how
                        // connectorType went missing from every bulk-synced record.
                        Map<String, String> provenance = new java.util.LinkedHashMap<>();
                        for (Map.Entry<String, Object> entry : metadata.entrySet()) {
                            String key = entry.getKey();
                            if (AppConstants.META_TITLE.equals(key)
                                || AppConstants.META_CATEGORY.equals(key)
                                || AppConstants.META_DEPARTMENT.equals(key)
                                || AppConstants.META_SOURCE_TYPE.equals(key)) {
                                continue;
                            }
                            Object value = entry.getValue();
                            if (value != null && !String.valueOf(value).isBlank()) {
                                provenance.put(key, String.valueOf(value));
                            }
                        }

                        com.servicedesk.ai.domain.model.DocumentMetadata docMeta = com.servicedesk.ai.domain.model.DocumentMetadata.builder()
                            // Prefixed, to match the chunk's own documentId below and the
                            // key the index is queried and deleted by.
                            .documentId(AppConstants.VECTOR_ID_PREFIX + record.getRecordSysId())
                            .title((String) metadata.get(AppConstants.META_TITLE))
                            .department((String) metadata.get(AppConstants.META_DEPARTMENT))
                            .category((String) metadata.get(AppConstants.META_CATEGORY))
                            .sourceType(KnowledgeRecordUtils.sourceTypeFor(record.getRecordType()))
                            .sourceUri(record.getSourceUrl())
                            .ownerEmail(record.getOwnerEmail())
                            .customAttributes(provenance)
                            .createdDate(record.getSysUpdatedOn() != null ? record.getSysUpdatedOn() : Instant.now())
                            .build();
                        
                        knowledgeChunks.add(com.servicedesk.ai.domain.model.KnowledgeChunk.builder()
                            .chunkId(AppConstants.VECTOR_ID_PREFIX + record.getRecordSysId() + AppConstants.VECTOR_ID_SEPARATOR + i)
                            .documentId(AppConstants.VECTOR_ID_PREFIX + record.getRecordSysId())
                            .chunkIndex(i)
                            .textContent(chunkText)
                            .tokenCount(com.servicedesk.ai.domain.util.TextChunker.estimateTokens(chunkText))
                            .vectorEmbedding(embedding)
                            .metadata(docMeta)
                            .build());
                    }

                    // The return value has to be checked. Counting the record as indexed
                    // regardless meant a failed upsert was reported as success and, worse,
                    // moved the watermark past the record so it was never retried.
                    int upserted = vectorDatabasePort.upsertChunks(
                        AppConstants.COLLECTION_SERVICENOW, knowledgeChunks);
                    if (upserted < knowledgeChunks.size()) {
                        throw new IllegalStateException("Only " + upserted + " of "
                            + knowledgeChunks.size() + " chunks reached the vector index");
                    }
                    created++;

                    // Catalogued after the index write, and in its own try/catch. The
                    // vectors are already committed at this point, so a bookkeeping
                    // failure must not mark the record failed and hold the watermark
                    // back over a record that is in fact searchable.
                    catalogue(record, knowledgeChunks);

                    // Track the newest record actually indexed, so the next run resumes
                    // from real progress rather than from wall-clock time.
                    if (record.getSysUpdatedOn() != null) {
                        if (newestIndexed == null || record.getSysUpdatedOn().isAfter(newestIndexed)) {
                            newestIndexed = record.getSysUpdatedOn();
                        }
                    }
                } catch (Exception e) {
                    failed++;
                    // Remember the earliest failure so the watermark stops short of it.
                    if (record.getSysUpdatedOn() != null) {
                        if (oldestFailure == null || record.getSysUpdatedOn().isBefore(oldestFailure)) {
                            oldestFailure = record.getSysUpdatedOn();
                        }
                    }
                    log.warn("[ServiceNow Sync] Failed to index {}: {}",
                        record.getRecordNumber(), shortReason(e));
                }
            }
            offset += limit;

            } // end while(true)

            // The watermark may never pass a record that failed. Advancing to the newest
            // success would strand any older failure behind it: a rate-limited record in
            // the middle of a batch would be skipped by every subsequent run.
            Instant advanceTo = newestIndexed;
            if (oldestFailure != null) {
                advanceTo = (advanceTo == null || oldestFailure.isBefore(advanceTo)) ? oldestFailure : advanceTo;
                log.info("[ServiceNow Sync] {} record(s) failed; holding the watermark at {} so they are retried",
                    failed, advanceTo);
            }
            if (advanceTo != null) {
                saveWatermark(advanceTo.minusSeconds(WATERMARK_OVERLAP_SECONDS));
            }

            long duration = System.currentTimeMillis() - startTime;

            jobEntity.setStatus(failed == 0 ? AppConstants.STATUS_COMPLETED : AppConstants.STATUS_COMPLETED_WITH_ERRORS);
            jobEntity.setItemsCreated(created);
            jobEntity.setItemsFailed(failed);
            jobEntity.setExecutionTimeMs(duration);
            jobEntity.setCompletedAt(LocalDateTime.now());
            syncJobRepository.save(jobEntity);

            log.info("[ServiceNow Sync] Completed jobId={}, fetched={}, created={}, failed={}, duration={}ms",
                jobId, totalFetched, created, failed, duration);

            return new Result(jobId, totalFetched, created, duration, failed == 0);

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[ServiceNow Sync] Failed jobId={}: {}", jobId, e.getMessage(), e);

            jobEntity.setStatus(AppConstants.STATUS_FAILED);
            jobEntity.setErrorMessage(e.getMessage());
            jobEntity.setExecutionTimeMs(duration);
            jobEntity.setCompletedAt(LocalDateTime.now());
            syncJobRepository.save(jobEntity);

            return new Result(jobId, 0, 0, duration, false);
        }
    }

    /**
     * Records the indexed record in Postgres, plus any attachment references.
     *
     * <p>Best effort by design. The vectors are already written when this runs, so a
     * catalogue failure is logged and the record still counts as synced - the
     * alternative is failing a record that is genuinely searchable and then replaying
     * it on every subsequent run.
     */
    private void catalogue(KnowledgeRecord record, List<com.servicedesk.ai.domain.model.KnowledgeChunk> chunks) {
        IndexedDocumentCatalog.Entry entry = IndexedDocumentCatalog.Entry.builder()
            .connectorType(AppConstants.CONNECTOR_SERVICENOW)
            .externalId(record.getRecordSysId())
            .externalNumber(record.getRecordNumber())
            .vectorDocumentId(AppConstants.VECTOR_ID_PREFIX + record.getRecordSysId())
            .title(record.getTitle())
            .sourceType(KnowledgeRecordUtils.sourceTypeFor(record.getRecordType()).name())
            .sourceUri(record.getSourceUrl())
            .department(record.getDepartment())
            .category(record.getCategory())
            .ownerEmail(record.getOwnerEmail())
            .recordedBy("servicenow-sync")
            .build();

        try {
            catalog.recordIndexedDocument(entry, chunks);
            // Attachments are only fetched when the connector is configured to; when it
            // is, the references were previously discarded after being counted.
            if (record.getAttachments() != null && !record.getAttachments().isEmpty()) {
                catalog.recordAttachments(record.getAttachments(),
                    AppConstants.CONNECTOR_SERVICENOW, "servicenow-sync");
            }
        } catch (Exception e) {
            log.warn("[ServiceNow Sync] {} is indexed but was not catalogued: {}",
                record.getRecordNumber(), shortReason(e));
        }
    }

    /**
     * A one-line reason. Provider errors arrive as multi-line JSON, and one per failed
     * record buried the useful lines in the log.
     */
    private String shortReason(Exception e) {
        String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        int brace = message.indexOf('{');
        if (brace > 0) {
            message = message.substring(0, brace).trim();
        }
        message = message.replaceAll("\\s+", " ");
        return message.length() > 160 ? message.substring(0, 160) + "..." : message;
    }

    // ------------------------------------------------------------- watermark

    /**
     * Where the last successful run got to. Empty on a first run, which makes the sync
     * pull the full history once and then stay incremental from then on.
     */
    private Optional<Instant> storedWatermark() {
        return connectorRepository.findByConnectorType(AppConstants.CONNECTOR_SERVICENOW)
            .map(ConnectorConfigurationEntity::getLastSyncAt)
            .map(t -> t.atZone(java.time.ZoneId.systemDefault()).toInstant());
    }

    private void saveWatermark(Instant value) {
        try {
            ConnectorConfigurationEntity entity = connectorRepository
                .findByConnectorType(AppConstants.CONNECTOR_SERVICENOW)
                .orElseGet(() -> {
                    ConnectorConfigurationEntity fresh = new ConnectorConfigurationEntity();
                    fresh.setConnectorType(AppConstants.CONNECTOR_SERVICENOW);
                    fresh.setInstanceUrl("servicenow");
                    fresh.setIsActive(true);
                    return fresh;
                });
            entity.setLastSyncAt(LocalDateTime.ofInstant(value, java.time.ZoneId.systemDefault()));
            connectorRepository.save(entity);
            log.info("[ServiceNow Sync] Watermark advanced to {}", value);
        } catch (Exception e) {
            // A lost watermark costs a repeated sync, not data, so it must not fail the run.
            log.warn("[ServiceNow Sync] Could not persist the watermark: {}", e.getMessage());
        }
    }
}
