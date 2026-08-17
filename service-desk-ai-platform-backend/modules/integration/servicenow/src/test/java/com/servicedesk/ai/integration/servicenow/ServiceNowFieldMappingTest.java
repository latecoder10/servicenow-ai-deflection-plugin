package com.servicedesk.ai.integration.servicenow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.servicedesk.ai.integration.servicenow.ServiceNowRestAdapter.textOrNull;
import static org.junit.jupiter.api.Assertions.*;

/**
 * An unset ServiceNow field is not absent, it is empty, and a reference field is not a
 * string, it is an object. Both used to read back as "" and were then waved past every
 * "!= null" fallback until an empty department reached the vector index, where it
 * matched no department filter and made filtered searches silently return everything.
 */
class ServiceNowFieldMappingTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static JsonNode json(String raw) {
        try {
            return MAPPER.readTree(raw);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    @DisplayName("An unset field reads as null, not as an empty string")
    void emptyStringBecomesNull() {
        assertNull(textOrNull(json("{\"department\": \"\"}"), "department"));
    }

    @Test
    @DisplayName("A whitespace-only field reads as null")
    void whitespaceBecomesNull() {
        assertNull(textOrNull(json("{\"category\": \"   \"}"), "category"));
    }

    @Test
    @DisplayName("A missing field reads as null")
    void missingFieldBecomesNull() {
        assertNull(textOrNull(json("{}"), "department"));
    }

    @Test
    @DisplayName("An explicit JSON null reads as null")
    void jsonNullBecomesNull() {
        assertNull(textOrNull(json("{\"department\": null}"), "department"));
    }

    @Test
    @DisplayName("A reference field carries no readable name under display_value=false")
    void unresolvedReferenceBecomesNull() {
        // What sysparm_display_value=false actually returns for department: a link and a
        // sys_id, no name. asText() on it is "", which is what used to be indexed.
        String reference = "{\"department\": {\"link\": \"https://x.service-now.com/api/now/table/cmn_department/abc\","
            + "\"value\": \"abc\"}}";
        assertNull(textOrNull(json(reference), "department"));
    }

    @Test
    @DisplayName("A reference field's display_value is used when the query asks for one")
    void resolvedReferenceUsesDisplayValue() {
        String reference = "{\"department\": {\"display_value\": \"IT\", \"value\": \"abc\"}}";
        assertEquals("IT", textOrNull(json(reference), "department"));
    }

    @Test
    @DisplayName("An ordinary populated field is returned unchanged")
    void populatedFieldSurvives() {
        assertEquals("network", textOrNull(json("{\"category\": \"network\"}"), "category"));
    }

    @Test
    @DisplayName("Both resolution columns are requested, not just resolution_notes")
    void bothResolutionColumnsAreRequested() {
        // close_notes is the stock incident column and is where this platform's own
        // seeder writes. Reading only resolution_notes left every resolved incident
        // embedded with no resolution at all.
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("close_notes"));
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("resolution_notes"));
    }

    @Test
    @DisplayName("Reference columns are dot-walked so a name comes back, not a sys_id")
    void referenceColumnsAreDotWalked() {
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("department.name"));
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("assignment_group.name"));
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("caller_id.email"));
        assertTrue(ServiceNowRestAdapter.KB_FIELDS.contains("kb_category.label"));
    }

    @Test
    @DisplayName("Journal columns are requested so the embedded text can include them")
    void journalColumnsAreRequested() {
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("work_notes"));
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("comments"));
        assertTrue(ServiceNowRestAdapter.INCIDENT_FIELDS.contains("subcategory"));
    }
}
