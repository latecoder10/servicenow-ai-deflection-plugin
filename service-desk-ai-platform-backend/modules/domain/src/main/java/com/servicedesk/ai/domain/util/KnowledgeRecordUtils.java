package com.servicedesk.ai.domain.util;

import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.DocumentSourceType;
import com.servicedesk.ai.domain.model.KnowledgeRecord;

import java.time.ZoneId;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.Map;

public class KnowledgeRecordUtils {

    private KnowledgeRecordUtils() {}

    /**
     * The text that actually gets embedded, and therefore the only thing retrieval can
     * ever match on.
     *
     * <p>Every field is blank-guarded by the same helper. Category and assignment group
     * previously checked only for null, so an unset ServiceNow field - which arrives as
     * "" rather than null - produced a dangling "Assignment Group:" line with nothing
     * after it, embedding a label as though it were content.
     */
    public static String buildTextPayload(KnowledgeRecord record) {
        StringBuilder sb = new StringBuilder();
        sb.append("Title: ").append(record.getTitle()).append("\n");
        appendIfPresent(sb, "Description", record.getDescription());
        // The resolution is the single most valuable part of a resolved incident: it is
        // what makes the corpus answer questions rather than merely restate them.
        appendIfPresent(sb, "Resolution", record.getResolutionNotes());
        appendIfPresent(sb, "Work Notes", record.getWorkNotes());
        appendIfPresent(sb, "Comments", record.getComments());
        appendIfPresent(sb, "Category", record.getCategory());
        appendIfPresent(sb, "Subcategory", record.getSubcategory());
        appendIfPresent(sb, "Assignment Group", record.getAssignmentGroup());
        return sb.toString();
    }

    private static void appendIfPresent(StringBuilder sb, String label, String value) {
        if (value != null && !value.isBlank()) {
            sb.append(label).append(": ").append(value.trim()).append("\n");
        }
    }

    /** The value, or the fallback when it is null <em>or</em> blank. */
    private static String blankTo(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    /**
     * Which kind of ServiceNow document a record is. The sync writes recordType as
     * "KNOWLEDGE_ARTICLE" rather than as a table name, so this matches on substance
     * instead of on an exact string.
     */
    public static DocumentSourceType sourceTypeFor(String recordType) {
        if (recordType == null) {
            return DocumentSourceType.SERVICENOW_INCIDENT;
        }
        String type = recordType.trim().toUpperCase();
        boolean isKnowledge = type.contains("KNOWLEDGE") || type.startsWith("KB");
        return isKnowledge ? DocumentSourceType.SERVICENOW_KB : DocumentSourceType.SERVICENOW_INCIDENT;
    }

    public static Map<String, Object> buildMetadata(KnowledgeRecord record) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put(AppConstants.META_RECORD_NUMBER, record.getRecordNumber());
        meta.put(AppConstants.META_RECORD_SYS_ID, record.getRecordSysId());
        meta.put(AppConstants.META_RECORD_TYPE, record.getRecordType());
        meta.put(AppConstants.META_TITLE, record.getTitle());
        meta.put(AppConstants.META_CONNECTOR_TYPE, AppConstants.CONNECTOR_SERVICENOW);
        // blankTo rather than a null check throughout: an unset ServiceNow field arrives
        // as "", which is not null, so these fallbacks never fired and an empty
        // department was indexed - matching no department filter thereafter.
        meta.put(AppConstants.META_WORKSPACE, blankTo(record.getWorkspace(), AppConstants.DEFAULT_WORKSPACE));
        meta.put(AppConstants.META_CATEGORY, blankTo(record.getCategory(), AppConstants.DEFAULT_CATEGORY));
        meta.put(AppConstants.META_PRIORITY, blankTo(record.getPriority(), AppConstants.DEFAULT_PRIORITY));
        meta.put(AppConstants.META_DEPARTMENT, blankTo(record.getDepartment(), AppConstants.DEFAULT_DEPARTMENT));
        meta.put("state", blankTo(record.getState(), "Resolved"));
        if (record.getSubcategory() != null && !record.getSubcategory().isBlank()) {
            meta.put(AppConstants.META_SUBCATEGORY, record.getSubcategory());
        }
        if (record.getAssignmentGroup() != null && !record.getAssignmentGroup().isBlank()) {
            meta.put(AppConstants.META_ASSIGNMENT_GROUP, record.getAssignmentGroup());
        }
        // The record's own address, so a ServiceNow citation is read from the index like
        // any other source rather than rebuilt by convention at display time.
        if (record.getSourceUrl() != null && !record.getSourceUrl().isBlank()) {
            meta.put(AppConstants.META_SOURCE_URL, record.getSourceUrl());
        }
        meta.put(AppConstants.META_SOURCE_TYPE, sourceTypeFor(record.getRecordType()).name());
        meta.put(AppConstants.META_YEAR, String.valueOf(record.getSysUpdatedOn() != null
            ? record.getSysUpdatedOn().atZone(ZoneId.systemDefault()).getYear()
            : Year.now().getValue()));
        if (record.getAttachments() != null && !record.getAttachments().isEmpty()) {
            meta.put(AppConstants.META_ATTACHMENT_COUNT, String.valueOf(record.getAttachments().size()));
        }
        return meta;
    }
}
