package com.servicedesk.ai.application.service;

import com.servicedesk.ai.application.port.in.SyncServiceNowUseCase;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.entity.SyncJobEntity;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.repository.SyncJobJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    @Transactional
    public Result sync(Command command) {
        long startTime = System.currentTimeMillis();
        String jobId = "sync-" + UUID.randomUUID().toString().substring(0, 8);
        Instant since = command.syncFromTime() != null ? command.syncFromTime() : Instant.EPOCH;
        int limit = AppConstants.DEFAULT_BATCH_LIMIT;

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
                        
                        com.servicedesk.ai.domain.model.DocumentMetadata docMeta = com.servicedesk.ai.domain.model.DocumentMetadata.builder()
                            .documentId(record.getRecordSysId())
                            .title((String) metadata.get("title"))
                            .department((String) metadata.get("department"))
                            .category((String) metadata.get("category"))
                            .createdDate(record.getSysUpdatedOn() != null ? record.getSysUpdatedOn() : Instant.now())
                            .build();
                        
                        knowledgeChunks.add(com.servicedesk.ai.domain.model.KnowledgeChunk.builder()
                            .chunkId(AppConstants.VECTOR_ID_PREFIX + record.getRecordSysId() + AppConstants.VECTOR_ID_SEPARATOR + i)
                            .documentId(AppConstants.VECTOR_ID_PREFIX + record.getRecordSysId())
                            .chunkIndex(i)
                            .textContent(chunkText)
                            .vectorEmbedding(embedding)
                            .metadata(docMeta)
                            .build());
                    }

                    vectorDatabasePort.upsertChunks(AppConstants.COLLECTION_SERVICENOW, knowledgeChunks);
                    created++;
                } catch (Exception e) {
                    failed++;
                    log.warn("[ServiceNow Sync] Failed to index {}: {}", record.getRecordNumber(), e.getMessage());
                }
            }
            offset += limit;

            } // end while(true)

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

}
