package com.servicedesk.ai.application.connector;

import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.AttachmentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.model.SyncResult;
import com.servicedesk.ai.domain.port.out.EmbeddingPort;
import com.servicedesk.ai.domain.port.out.KnowledgeConnector;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.domain.port.out.VectorDatabasePort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

/**
 * ServiceNow Knowledge Connector implementation.
 * Connects to ServiceNow instance, fetches resolved incidents and knowledge articles,
 * extracts chunk text, generates embeddings, and pushes to Pinecone index.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ServiceNowKnowledgeConnector implements KnowledgeConnector {

    private final ServiceNowPort serviceNowPort;
    private final EmbeddingPort embeddingPort;
    private final VectorDatabasePort vectorDatabasePort;

    @Override
    public String getConnectorType() {
        return AppConstants.CONNECTOR_SERVICENOW;
    }

    @Override
    public boolean testConnection(Map<String, String> configMap) {
        log.info("[ServiceNow Connector] Testing connection health for config map: {}", configMap.keySet());
        return serviceNowPort.validateConnection();
    }

    @Override
    public SyncResult synchronize(SyncRequest request) {
        long startTime = System.currentTimeMillis();
        String jobId = request.getJobId() != null ? request.getJobId() : "job-" + UUID.randomUUID().toString();
        Instant since = request.getSinceTimestamp() != null ? request.getSinceTimestamp() : Instant.EPOCH;

        log.info("[ServiceNow Connector] Starting {} sync job={} since={}", request.getSyncType(), jobId, since);

        int created = 0;
        int updated = 0;
        int failed = 0;
        int skipped = 0;

        try {
            List<KnowledgeRecord> records = serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(since, request.getBatchLimit() > 0 ? request.getBatchLimit() : AppConstants.DEFAULT_BATCH_LIMIT, 0);
            log.info("[ServiceNow Connector] Fetched {} records from ServiceNow API", records.size());

            // Phase 1: Build all text payloads and metadata
            List<String> textPayloads = new ArrayList<>();
            List<Map<String, Object>> metadataList = new ArrayList<>();
            List<String> vectorIds = new ArrayList<>();

            for (KnowledgeRecord record : records) {
                try {
                    String textToChunk = buildTextPayload(record);
                    textPayloads.add(textToChunk);

                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("incidentNumber", record.getRecordNumber());
                    metadata.put("incidentSysId", record.getRecordSysId());
                    metadata.put("recordType", record.getRecordType());
                    metadata.put("title", record.getTitle());
                    metadata.put("workspace", record.getWorkspace() != null ? record.getWorkspace() : AppConstants.DEFAULT_WORKSPACE);
                    metadata.put("category", record.getCategory() != null ? record.getCategory() : AppConstants.DEFAULT_CATEGORY);
                    metadata.put("priority", record.getPriority() != null ? record.getPriority() : AppConstants.DEFAULT_PRIORITY);
                    metadata.put("department", record.getDepartment() != null ? record.getDepartment() : AppConstants.DEFAULT_DEPARTMENT);
                    metadata.put("connectorType", getConnectorType());
                    metadata.put("year", String.valueOf(Calendar.getInstance().get(Calendar.YEAR)));
                    metadata.put("attachmentCount", String.valueOf(record.getAttachments().size()));
                    metadataList.add(metadata);

                    vectorIds.add(AppConstants.VECTOR_ID_PREFIX + record.getRecordSysId() + AppConstants.VECTOR_ID_SEPARATOR + "0");
                } catch (Exception e) {
                    failed++;
                    log.error("[ServiceNow Connector] Failed to prepare record {}: {}", record.getRecordNumber(), e.getMessage());
                }
            }

            if (textPayloads.isEmpty()) {
                log.warn("[ServiceNow Connector] No records to index after preparation");
            } else {
                // Phase 2: Batch generate embeddings (single API call for all texts)
                log.info("[ServiceNow Connector] Generating embeddings for {} records in batch", textPayloads.size());
                List<List<Float>> embeddings = embeddingPort.generateBatchEmbeddings(textPayloads);

                // Phase 3: Build VectorEntry list and batch upsert
                List<VectorDatabasePort.VectorEntry> entries = new ArrayList<>();
                for (int i = 0; i < textPayloads.size(); i++) {
                    entries.add(new VectorDatabasePort.VectorEntry(vectorIds.get(i), embeddings.get(i), metadataList.get(i)));
                }

                int upserted = vectorDatabasePort.upsertVectors(AppConstants.COLLECTION_SERVICENOW, entries);
                created = upserted;
                log.info("[ServiceNow Connector] Batch upserted {}/{} vectors into Pinecone", upserted, entries.size());
            }

            long duration = System.currentTimeMillis() - startTime;
            return SyncResult.builder()
                .jobId(jobId)
                .connectorType(getConnectorType())
                .syncType(request.getSyncType())
                .status(failed == 0 ? AppConstants.STATUS_COMPLETED : AppConstants.STATUS_COMPLETED_WITH_ERRORS)
                .itemsFetched(records.size())
                .itemsCreated(created)
                .itemsUpdated(updated)
                .itemsSkipped(skipped)
                .itemsFailed(failed)
                .executionTimeMs(duration)
                .startedAt(Instant.ofEpochMilli(startTime))
                .completedAt(Instant.now())
                .build();

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[ServiceNow Connector] Sync job failed: {}", e.getMessage(), e);
            return SyncResult.builder()
                .jobId(jobId)
                .connectorType(getConnectorType())
                .syncType(request.getSyncType())
                .status(AppConstants.STATUS_FAILED)
                .errorMessage(e.getMessage())
                .executionTimeMs(duration)
                .startedAt(Instant.ofEpochMilli(startTime))
                .completedAt(Instant.now())
                .build();
        }
    }

    @Override
    public List<KnowledgeRecord> fetchChanges(Instant since, int maxLimit) {
        return serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(since, maxLimit, 0);
    }

    @Override
    public AttachmentMetadata getAttachmentMetadata(String attachmentId) {
        return serviceNowPort.getAttachmentMetadata(attachmentId);
    }

    @Override
    public byte[] downloadAttachmentContent(String attachmentId) {
        return serviceNowPort.downloadAttachmentContent(attachmentId);
    }

    private String buildTextPayload(KnowledgeRecord record) {
        StringBuilder sb = new StringBuilder();
        sb.append("Title: ").append(record.getTitle()).append("\n");
        if (record.getDescription() != null) {
            sb.append("Description: ").append(record.getDescription()).append("\n");
        }
        if (record.getResolutionNotes() != null) {
            sb.append("Resolution Notes: ").append(record.getResolutionNotes()).append("\n");
        }
        if (record.getCategory() != null) {
            sb.append("Category: ").append(record.getCategory()).append("\n");
        }
        if (record.getAssignmentGroup() != null) {
            sb.append("Assignment Group: ").append(record.getAssignmentGroup()).append("\n");
        }
        return sb.toString();
    }
}
