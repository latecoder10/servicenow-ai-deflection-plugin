package com.servicedesk.ai.api.mapper;

import com.servicedesk.ai.api.dto.response.SourceReference;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Turns the chunks that grounded a suggestion into citable references.
 *
 * Several chunks can come from the same record, so results are de-duplicated by
 * record number, keeping the highest-scoring chunk for each.
 */
@Component
@RequiredArgsConstructor
public class SourceReferenceMapper {

    private static final String TYPE_KB = "kb_knowledge";
    private static final int MAX_SOURCES = 5;

    /** Metadata key holding a source's own address, written by non-ServiceNow connectors. */
    private static final String SOURCE_URL_KEY = "sourceUrl";

    private final ServiceNowConfig serviceNowConfig;

    public List<SourceReference> toReferences(List<KnowledgeChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }

        List<SourceReference> refs = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (KnowledgeChunk chunk : chunks) {
            DocumentMetadata meta = chunk.getMetadata();
            if (meta == null) {
                continue;
            }
            Map<String, String> attrs = meta.customAttributes() != null ? meta.customAttributes() : Map.of();

            String number = attrs.get(AppConstants.META_RECORD_NUMBER);
            String sysId = attrs.get(AppConstants.META_RECORD_SYS_ID);

            // Vectors indexed before provenance was written carry neither. The sys_id
            // is still recoverable from the documentId ("sn-<sys_id>"), which is enough
            // for a working link and a title, so those sources are still cited.
            if (sysId == null || sysId.isBlank()) {
                sysId = stripVectorPrefix(meta.documentId());
            }

            String dedupeKey = (number != null && !number.isBlank()) ? number : sysId;
            if (dedupeKey == null || dedupeKey.isBlank() || !seen.add(dedupeKey)) {
                continue;   // chunks arrive best-first, so the first win is the best one
            }

            String type = attrs.get(AppConstants.META_RECORD_TYPE);
            refs.add(new SourceReference(
                number,
                type,
                // ServiceNow short descriptions often carry trailing tabs and newlines,
                // which show up as ragged whitespace in the sidebar.
                meta.title() == null ? null : meta.title().replaceAll("\\s+", " ").trim(),
                buildUrl(attrs, type, sysId, meta.sourceUri()),
                round(chunk.getRelevanceScore())
            ));

            if (refs.size() >= MAX_SOURCES) {
                break;
            }
        }
        return refs;
    }

    /**
     * Link a person can follow back to the source.
     *
     * Records synced from another system carry their own address, so that is used when
     * present. Only ServiceNow records get a ServiceNow deep link built for them:
     * assuming every source lives in the instance would hand a Drive document a
     * fabricated incident URL that 404s.
     *
     * Returns null rather than a broken link when nothing can be resolved, letting the
     * UI fall back to plain text.
     */
    private String buildUrl(Map<String, String> attrs, String recordType, String sysId, String sourceUri) {
        String external = firstNonBlank(attrs.get(SOURCE_URL_KEY), sourceUri);
        if (external != null) {
            return external;
        }

        String connector = attrs.get(AppConstants.META_CONNECTOR_TYPE);
        boolean isServiceNow = connector == null                       // legacy vectors predate the field
            || AppConstants.CONNECTOR_SERVICENOW.equalsIgnoreCase(connector);
        if (!isServiceNow) {
            return null;
        }

        String instance = serviceNowConfig.getInstanceUrl();
        if (instance == null || instance.isBlank() || sysId == null || sysId.isBlank()) {
            return null;
        }
        return instance.replaceAll("/+$", "") + "/" + tableFor(recordType) + ".do?sys_id=" + sysId;
    }

    /**
     * The ServiceNow table a record lives in.
     *
     * The sync writes recordType as "KNOWLEDGE_ARTICLE", not as the table name, so an
     * exact comparison against "kb_knowledge" never matched and every knowledge article
     * was given an incident URL that 404s.
     */
    private String tableFor(String recordType) {
        if (recordType == null) {
            return "incident";
        }
        String t = recordType.trim().toUpperCase();
        boolean isKnowledge = t.contains("KNOWLEDGE") || t.startsWith("KB");
        return isKnowledge ? TYPE_KB : "incident";
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    /** "sn-e8e875b0c0a8..." -> "e8e875b0c0a8...". Returns null when there is nothing to strip. */
    private String stripVectorPrefix(String documentId) {
        if (documentId == null || documentId.isBlank()) {
            return null;
        }
        return documentId.startsWith(AppConstants.VECTOR_ID_PREFIX)
            ? documentId.substring(AppConstants.VECTOR_ID_PREFIX.length())
            : documentId;
    }

    private double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }
}
