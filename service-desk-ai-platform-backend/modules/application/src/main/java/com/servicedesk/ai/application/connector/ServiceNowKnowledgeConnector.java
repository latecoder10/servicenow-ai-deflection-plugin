package com.servicedesk.ai.application.connector;

import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.application.port.in.SyncServiceNowUseCase;
import com.servicedesk.ai.application.service.ServiceNowSyncOrchestrator;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.model.SyncResult;
import com.servicedesk.ai.domain.port.out.KnowledgeConnector;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;

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
    private final ServiceNowSyncOrchestrator orchestrator;

    @Override
    public String getConnectorType() {
        return AppConstants.CONNECTOR_SERVICENOW;
    }

    @Override
    public boolean testConnection(Map<String, String> configMap) {
        log.info("[ServiceNow Connector] Testing connection health for config map: {}", configMap.keySet());
        return serviceNowPort.validateConnection();
    }

    /**
     * Delegates to {@link ServiceNowSyncOrchestrator}, which is also what the scheduler
     * runs.
     *
     * This class previously carried a second, independent implementation. It differed in
     * ways that mattered: no watermark so every run was a full re-index, one vector per
     * record instead of chunking, metadata keyed "incidentNumber"/"incidentSysId" rather
     * than the names the retrieval path reads, and a year taken from the clock rather
     * than the record, which filed vectors under the wrong namespace. Records synced
     * through the API were therefore not citable and not equivalent to scheduled ones.
     * One implementation removes that whole class of divergence.
     */
    @Override
    public SyncResult synchronize(SyncRequest request) {
        long startTime = System.currentTimeMillis();
        boolean full = "FULL".equalsIgnoreCase(request.getSyncType());

        SyncServiceNowUseCase.Command command = new SyncServiceNowUseCase.Command(
            "ALL",
            request.getSinceTimestamp(),   // null lets the orchestrator resume from its watermark
            full
        );

        SyncServiceNowUseCase.Result result = orchestrator.sync(command);

        return SyncResult.builder()
            .jobId(result.jobId() != null ? result.jobId() : request.getJobId())
            .connectorType(getConnectorType())
            .syncType(request.getSyncType())
            .status(result.status() ? AppConstants.STATUS_COMPLETED : AppConstants.STATUS_COMPLETED_WITH_ERRORS)
            .itemsFetched(result.totalFetched())
            .itemsCreated(result.totalIndexed())
            .itemsFailed(result.totalFetched() - result.totalIndexed())
            .executionTimeMs(result.durationMillis())
            .startedAt(Instant.ofEpochMilli(startTime))
            .completedAt(Instant.now())
            .build();
    }

    @Override
    public List<KnowledgeRecord> fetchChanges(Instant since, int maxLimit) {
        return serviceNowPort.fetchAllResolvedKnowledgeRecordsSince(since, maxLimit, 0);
    }



}
