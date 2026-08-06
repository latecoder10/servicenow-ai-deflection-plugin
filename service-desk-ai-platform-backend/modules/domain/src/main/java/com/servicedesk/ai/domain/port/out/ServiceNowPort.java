package com.servicedesk.ai.domain.port.out;

import com.servicedesk.ai.domain.model.AttachmentMetadata;
import com.servicedesk.ai.domain.model.Incident;
import com.servicedesk.ai.domain.model.KnowledgeRecord;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ServiceNowPort {
    Incident createIncident(Incident incident);

    Incident updateIncident(String sysId, Map<String, Object> fields);
    
    Optional<Incident> getIncidentBySysId(String sysId);

    Optional<KnowledgeRecord> getKnowledgeRecordBySysId(String sysId);
    
    List<Incident> fetchResolvedIncidentsSince(Instant updatedSince, int limit, int offset);
    
    List<KnowledgeRecord> fetchKnowledgeArticlesSince(Instant updatedSince, int limit, int offset);

    List<KnowledgeRecord> fetchAllResolvedKnowledgeRecordsSince(Instant updatedSince, int limit, int offset);
    
    List<Incident> searchSimilarIncidents(String queryText, int maxResults);
    
    boolean validateConnection();

    List<AttachmentMetadata> fetchAttachmentsMetadataForRecord(String tableName, String recordSysId);

    AttachmentMetadata getAttachmentMetadata(String attachmentId);

    byte[] downloadAttachmentContent(String attachmentId);
}
