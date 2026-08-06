package com.servicedesk.ai.domain.util;

import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.KnowledgeRecord;

import java.time.ZoneId;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.Map;

public class KnowledgeRecordUtils {

    private KnowledgeRecordUtils() {}

    public static String buildTextPayload(KnowledgeRecord record) {
        StringBuilder sb = new StringBuilder();
        sb.append("Title: ").append(record.getTitle()).append("\n");
        if (record.getDescription() != null && !record.getDescription().isBlank()) {
            sb.append("Description: ").append(record.getDescription()).append("\n");
        }
        if (record.getResolutionNotes() != null && !record.getResolutionNotes().isBlank()) {
            sb.append("Resolution: ").append(record.getResolutionNotes()).append("\n");
        }
        if (record.getWorkNotes() != null && !record.getWorkNotes().isBlank()) {
            sb.append("Work Notes: ").append(record.getWorkNotes()).append("\n");
        }
        if (record.getComments() != null && !record.getComments().isBlank()) {
            sb.append("Comments: ").append(record.getComments()).append("\n");
        }
        if (record.getCategory() != null) {
            sb.append("Category: ").append(record.getCategory()).append("\n");
        }
        if (record.getAssignmentGroup() != null) {
            sb.append("Assignment Group: ").append(record.getAssignmentGroup()).append("\n");
        }
        return sb.toString();
    }

    public static Map<String, Object> buildMetadata(KnowledgeRecord record) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put(AppConstants.META_RECORD_NUMBER, record.getRecordNumber());
        meta.put(AppConstants.META_RECORD_SYS_ID, record.getRecordSysId());
        meta.put(AppConstants.META_RECORD_TYPE, record.getRecordType());
        meta.put(AppConstants.META_TITLE, record.getTitle());
        meta.put(AppConstants.META_CONNECTOR_TYPE, AppConstants.CONNECTOR_SERVICENOW);
        meta.put(AppConstants.META_WORKSPACE, record.getWorkspace() != null ? record.getWorkspace() : AppConstants.DEFAULT_WORKSPACE);
        meta.put(AppConstants.META_CATEGORY, record.getCategory() != null ? record.getCategory() : AppConstants.DEFAULT_CATEGORY);
        meta.put(AppConstants.META_PRIORITY, record.getPriority() != null ? record.getPriority() : AppConstants.DEFAULT_PRIORITY);
        meta.put(AppConstants.META_DEPARTMENT, record.getDepartment() != null ? record.getDepartment() : AppConstants.DEFAULT_DEPARTMENT);
        meta.put("state", record.getState() != null ? record.getState() : "Resolved");
        meta.put(AppConstants.META_YEAR, String.valueOf(record.getSysUpdatedOn() != null
            ? record.getSysUpdatedOn().atZone(ZoneId.systemDefault()).getYear()
            : Year.now().getValue()));
        if (record.getAttachments() != null && !record.getAttachments().isEmpty()) {
            meta.put(AppConstants.META_ATTACHMENT_COUNT, String.valueOf(record.getAttachments().size()));
        }
        return meta;
    }
}
