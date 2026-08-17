package com.servicedesk.ai.api;

import com.servicedesk.ai.api.dto.response.SourceReference;
import com.servicedesk.ai.api.mapper.SourceReferenceMapper;
import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.DocumentMetadata;
import com.servicedesk.ai.domain.model.KnowledgeChunk;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SourceReferenceMapperTest {

    private SourceReferenceMapper mapper;

    @BeforeEach
    void setUp() {
        ServiceNowConfig config = new ServiceNowConfig();
        config.setInstanceUrl("https://dev308607.service-now.com");
        mapper = new SourceReferenceMapper(config);
    }

    private KnowledgeChunk chunk(String documentId, String title, double score, Map<String, String> attrs) {
        return KnowledgeChunk.builder()
            .chunkId(documentId + "-0")
            .documentId(documentId)
            .relevanceScore(score)
            .metadata(DocumentMetadata.builder()
                .documentId(documentId)
                .title(title)
                .customAttributes(attrs)
                .build())
            .build();
    }

    private Map<String, String> attrs(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put(kv[i], kv[i + 1]);
        }
        return m;
    }

    @Test
    @DisplayName("ServiceNow records deep-link into the instance")
    void serviceNowRecordsLinkToTheInstance() {
        List<SourceReference> refs = mapper.toReferences(List.of(
            chunk("sn-46e2fee9", "VPN client will not launch", 0.62, attrs(
                AppConstants.META_RECORD_NUMBER, "INC0000015",
                AppConstants.META_RECORD_SYS_ID, "46e2fee9",
                AppConstants.META_RECORD_TYPE, "INCIDENT",
                AppConstants.META_CONNECTOR_TYPE, "SERVICENOW"))));

        assertEquals(1, refs.size());
        assertEquals("INC0000015", refs.get(0).recordNumber());
        assertEquals("https://dev308607.service-now.com/incident.do?sys_id=46e2fee9", refs.get(0).url());
    }

    @Test
    @DisplayName("Knowledge articles link to kb_knowledge, using the recordType the sync writes")
    void knowledgeArticlesLinkToTheKnowledgeTable() {
        // The sync writes "KNOWLEDGE_ARTICLE", not the table name. Comparing against
        // "kb_knowledge" never matched, so every article got an incident URL that 404s.
        List<SourceReference> refs = mapper.toReferences(List.of(
            chunk("sn-435186b5", "How to configure VPN for Apple Devices", 0.61, attrs(
                AppConstants.META_RECORD_NUMBER, "KB0000008",
                AppConstants.META_RECORD_SYS_ID, "435186b5",
                AppConstants.META_RECORD_TYPE, "KNOWLEDGE_ARTICLE",
                AppConstants.META_CONNECTOR_TYPE, "SERVICENOW"))));

        assertTrue(refs.get(0).url().contains("/kb_knowledge.do"),
            "a knowledge article must not be given an incident URL: " + refs.get(0).url());
        assertFalse(refs.get(0).url().contains("/incident.do"));
    }

    @Test
    @DisplayName("Titles are cleaned of the ragged whitespace ServiceNow returns")
    void titlesAreNormalised() {
        List<SourceReference> refs = mapper.toReferences(List.of(
            chunk("sn-abc", "How to configure VPN for Apple Devices\n\t\t", 0.6, attrs(
                AppConstants.META_RECORD_NUMBER, "KB0000008",
                AppConstants.META_RECORD_SYS_ID, "abc",
                AppConstants.META_RECORD_TYPE, "KNOWLEDGE_ARTICLE"))));

        assertEquals("How to configure VPN for Apple Devices", refs.get(0).title());
    }

    @Test
    @DisplayName("Drive documents link to Drive, never to a fabricated incident URL")
    void driveDocumentsLinkToDrive() {
        String driveUrl = "https://docs.google.com/document/d/1FjKTwz/edit";
        List<SourceReference> refs = mapper.toReferences(List.of(
            chunk("gd-1FjKTwz", "VPN will not connect", 0.71, attrs(
                AppConstants.META_RECORD_NUMBER, "IT-002",
                AppConstants.META_RECORD_SYS_ID, "1FjKTwz",
                AppConstants.META_RECORD_TYPE, "GOOGLE_DRIVE_DOC",
                AppConstants.META_CONNECTOR_TYPE, "GOOGLE_DRIVE",
                "sourceUrl", driveUrl))));

        assertEquals(driveUrl, refs.get(0).url(),
            "a Drive document must not be handed a ServiceNow incident URL");
        assertFalse(refs.get(0).url().contains("service-now.com"));
    }

    @Test
    @DisplayName("A non-ServiceNow source with no address of its own gets no link at all")
    void unknownSourceWithoutUrlIsNotLinked() {
        List<SourceReference> refs = mapper.toReferences(List.of(
            chunk("gd-abc", "Some shared document", 0.5, attrs(
                AppConstants.META_RECORD_SYS_ID, "abc",
                AppConstants.META_CONNECTOR_TYPE, "GOOGLE_DRIVE"))));

        assertNull(refs.get(0).url(), "better no link than one that 404s");
    }

    @Test
    @DisplayName("Records indexed before connectorType existed are still linked to ServiceNow")
    void legacyVectorsStillResolve() {
        // Everything in the index predates the provenance work; documentId is "sn-<sys_id>".
        List<SourceReference> refs = mapper.toReferences(List.of(
            chunk("sn-e8e875b0", "CPU load high", 0.55, attrs())));

        assertEquals("https://dev308607.service-now.com/incident.do?sys_id=e8e875b0", refs.get(0).url());
    }

    @Test
    @DisplayName("Several chunks from one record are cited once")
    void chunksFromTheSameRecordAreDeduplicated() {
        Map<String, String> same = attrs(
            AppConstants.META_RECORD_NUMBER, "INC0000015",
            AppConstants.META_RECORD_SYS_ID, "46e2fee9",
            AppConstants.META_CONNECTOR_TYPE, "SERVICENOW");

        List<SourceReference> refs = mapper.toReferences(List.of(
            chunk("sn-46e2fee9", "VPN client", 0.62, same),
            chunk("sn-46e2fee9", "VPN client", 0.48, same)));

        assertEquals(1, refs.size());
        assertEquals(0.62, refs.get(0).relevance(), 0.001, "the best-scoring chunk should win");
    }
}
