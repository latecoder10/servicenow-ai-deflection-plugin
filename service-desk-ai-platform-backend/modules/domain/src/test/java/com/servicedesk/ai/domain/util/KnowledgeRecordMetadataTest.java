package com.servicedesk.ai.domain.util;

import com.servicedesk.ai.domain.AppConstants;
import com.servicedesk.ai.domain.model.DocumentSourceType;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The metadata built here is what a chunk is filtered and cited by for as long as it
 * stays in the index, so a blank value written now is a search that quietly returns the
 * wrong scope later: Pinecone's $eq never matches "", and the query then falls back to
 * an unfiltered retry that looks like a working filter.
 */
class KnowledgeRecordMetadataTest {

    private KnowledgeRecord.KnowledgeRecordBuilder record() {
        return KnowledgeRecord.builder()
            .recordSysId("46f6ede0a9fe198100e10154c34a0c2a")
            .recordNumber("INC0000030")
            .title("Lost connection to the wireless network")
            .recordType("INCIDENT");
    }

    @Test
    @DisplayName("An empty department falls back to the default rather than being indexed blank")
    void emptyDepartmentIsReplaced() {
        Map<String, Object> meta = KnowledgeRecordUtils.buildMetadata(
            record().department("").category("").priority("").build());

        assertEquals(AppConstants.DEFAULT_DEPARTMENT, meta.get(AppConstants.META_DEPARTMENT));
        assertEquals(AppConstants.DEFAULT_CATEGORY, meta.get(AppConstants.META_CATEGORY));
        assertEquals(AppConstants.DEFAULT_PRIORITY, meta.get(AppConstants.META_PRIORITY));
    }

    @Test
    @DisplayName("A null department falls back too")
    void nullDepartmentIsReplaced() {
        Map<String, Object> meta = KnowledgeRecordUtils.buildMetadata(record().build());

        assertEquals(AppConstants.DEFAULT_DEPARTMENT, meta.get(AppConstants.META_DEPARTMENT));
        assertEquals(AppConstants.DEFAULT_WORKSPACE, meta.get(AppConstants.META_WORKSPACE));
    }

    @Test
    @DisplayName("No metadata value is ever blank")
    void noValueIsBlank() {
        Map<String, Object> meta = KnowledgeRecordUtils.buildMetadata(
            record().department("  ").category("").state("").workspace("").build());

        meta.forEach((key, value) -> assertFalse(
            value != null && String.valueOf(value).isBlank(),
            "'" + key + "' was indexed blank, which no $eq filter can ever match"));
    }

    @Test
    @DisplayName("A real department is kept, not overwritten by the default")
    void realDepartmentSurvives() {
        Map<String, Object> meta = KnowledgeRecordUtils.buildMetadata(
            record().department("IT").category("Network & Connectivity").build());

        assertEquals("IT", meta.get(AppConstants.META_DEPARTMENT));
        assertEquals("Network & Connectivity", meta.get(AppConstants.META_CATEGORY));
    }

    @Test
    @DisplayName("The record's own URL is carried into the index when the connector resolved one")
    void sourceUrlIsCarried() {
        Map<String, Object> meta = KnowledgeRecordUtils.buildMetadata(
            record().sourceUrl("https://dev123.service-now.com/incident.do?sys_id=46f6").build());

        assertEquals("https://dev123.service-now.com/incident.do?sys_id=46f6",
            meta.get(AppConstants.META_SOURCE_URL));
    }

    @Test
    @DisplayName("A record with no resolvable URL omits the key rather than indexing a blank")
    void absentSourceUrlIsOmitted() {
        Map<String, Object> meta = KnowledgeRecordUtils.buildMetadata(record().sourceUrl("").build());

        assertFalse(meta.containsKey(AppConstants.META_SOURCE_URL));
    }

    @Test
    @DisplayName("The resolution is embedded, since it is what makes a resolved incident useful")
    void resolutionReachesTheEmbeddedText() {
        String payload = KnowledgeRecordUtils.buildTextPayload(
            record().description("Cannot join the wireless network")
                    .resolutionNotes("Forgot the network on the device and re-entered credentials")
                    .build());

        assertTrue(payload.contains("Resolution: Forgot the network on the device"),
            "without the resolution the corpus only restates symptoms");
    }

    @Test
    @DisplayName("Journal notes and subcategory are embedded when the instance returns them")
    void journalFieldsReachTheEmbeddedText() {
        String payload = KnowledgeRecordUtils.buildTextPayload(
            record().workNotes("Access point on floor 3 was saturated")
                    .comments("User confirmed it is stable now")
                    .subcategory("Wireless")
                    .build());

        assertTrue(payload.contains("Work Notes: Access point on floor 3 was saturated"));
        assertTrue(payload.contains("Comments: User confirmed it is stable now"));
        assertTrue(payload.contains("Subcategory: Wireless"));
    }

    @Test
    @DisplayName("A blank field produces no dangling label in the embedded text")
    void blankFieldsProduceNoDanglingLabel() {
        String payload = KnowledgeRecordUtils.buildTextPayload(
            record().assignmentGroup("").category("  ").description(null).build());

        // "Assignment Group:" with nothing after it embeds a label as though it were
        // content, which is exactly what the search results showed.
        assertFalse(payload.contains("Assignment Group:"));
        assertFalse(payload.contains("Category:"));
        for (String line : payload.split("\n")) {
            assertFalse(line.trim().endsWith(":"), "dangling label in embedded text: '" + line + "'");
        }
    }

    @Test
    @DisplayName("Source type distinguishes an article from an incident")
    void sourceTypeFollowsRecordType() {
        assertEquals(DocumentSourceType.SERVICENOW_INCIDENT, KnowledgeRecordUtils.sourceTypeFor("INCIDENT"));
        assertEquals(DocumentSourceType.SERVICENOW_KB, KnowledgeRecordUtils.sourceTypeFor("KNOWLEDGE_ARTICLE"));
        assertEquals(DocumentSourceType.SERVICENOW_KB, KnowledgeRecordUtils.sourceTypeFor("kb_knowledge"));
        // An unknown type still indexes as something citable rather than as null.
        assertEquals(DocumentSourceType.SERVICENOW_INCIDENT, KnowledgeRecordUtils.sourceTypeFor(null));
    }
}
