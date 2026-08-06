package com.servicedesk.ai.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Unified Knowledge Record extracted from enterprise systems (ServiceNow Incidents & Knowledge Articles).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeRecord {
    private String id;
    private String recordSysId; // ServiceNow sys_id or external ID
    private String recordNumber; // e.g., INC0012948, KB0010923
    private String title; // Short description or article title
    private String description; // Full issue description or article text
    private String resolutionNotes; // Incident resolution notes
    private String workNotes;
    private String comments;
    private String category;
    private String subcategory;
    private String priority;
    private String assignmentGroup;
    private String configurationItem;
    private String relatedServices;
    private String workspace;
    private String department;
    private String recordType; // INCIDENT or KNOWLEDGE_ARTICLE
    private String state; // Resolved, Closed, Published
    private String connectorType; // SERVICENOW, JIRA, CONFLUENCE, SHAREPOINT
    
    private Instant sysCreatedOn;
    private Instant sysUpdatedOn;

    @Builder.Default
    private List<AttachmentMetadata> attachments = new ArrayList<>();
}
