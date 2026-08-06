package com.servicedesk.ai.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Stores metadata references for ServiceNow attachments.
 * Binary payload/file contents are NEVER duplicated locally; fetched on-demand from ServiceNow Attachment API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentMetadata {
    private String id;
    private String attachmentSysId;
    private String fileName;
    private String mimeType;
    private long fileSize;
    private String tableName; // e.g. 'incident', 'kb_knowledge'
    private String recordSysId; // parent record sys_id
    private String downloadUrl;
    private Instant createdOn;
}
