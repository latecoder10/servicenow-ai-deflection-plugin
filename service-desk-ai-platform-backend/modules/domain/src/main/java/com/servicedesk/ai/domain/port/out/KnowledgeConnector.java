package com.servicedesk.ai.domain.port.out;

import com.servicedesk.ai.domain.model.AttachmentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.domain.model.SyncRequest;
import com.servicedesk.ai.domain.model.SyncResult;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Extensible Knowledge Connector Interface.
 * Implementations connect to enterprise sources (ServiceNow, Jira, Confluence, SharePoint)
 * to continuously synchronize resolved incidents and knowledge articles.
 */
public interface KnowledgeConnector {

    /**
     * Returns unique identifier for connector (e.g., SERVICENOW, JIRA, CONFLUENCE, SHAREPOINT).
     */
    String getConnectorType();

    /**
     * Validates connection health and credentials to the target system.
     */
    boolean testConnection(Map<String, String> configMap);

    /**
     * Executes synchronization (full or incremental) according to SyncRequest.
     */
    SyncResult synchronize(SyncRequest request);

    /**
     * Fetches modified or newly resolved records since given timestamp.
     */
    List<KnowledgeRecord> fetchChanges(Instant since, int maxLimit);

    /**
     * Retrieves attachment metadata reference without fetching binary contents.
     */
    AttachmentMetadata getAttachmentMetadata(String attachmentId);

    /**
     * Streams or fetches attachment content binary on-demand from source system API.
     */
    byte[] downloadAttachmentContent(String attachmentId);
}
