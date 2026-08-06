package com.servicedesk.ai.integration.servicenow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.domain.model.AttachmentMetadata;
import com.servicedesk.ai.domain.model.Incident;
import com.servicedesk.ai.domain.model.KnowledgeRecord;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowConfig;
import com.servicedesk.ai.integration.servicenow.client.ServiceNowOAuth2Client;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class ServiceNowRestAdapter implements ServiceNowPort {

    private final ServiceNowConfig config;
    private final ServiceNowOAuth2Client oAuth2Client;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DateTimeFormatter snFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneOffset.UTC);

    public ServiceNowRestAdapter(ServiceNowConfig config, ServiceNowOAuth2Client oAuth2Client) {
        this.config = config;
        this.oAuth2Client = oAuth2Client;
    }

    // ──────────────────────── CREATE INCIDENT ────────────────────────

    @Override
    @CircuitBreaker(name = "serviceNowApi", fallbackMethod = "createIncidentFallback")
    @Retry(name = "serviceNowApi")
    public Incident createIncident(Incident incident) {
        String url = buildTableUrl("incident");
        log.info("[ServiceNow] POST {}", url);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("short_description", incident.getTitle());
        if (incident.getDescription() != null) body.put("description", incident.getDescription());
        if (incident.getCategory() != null) body.put("category", incident.getCategory());
        if (incident.getSubcategory() != null) body.put("subcategory", incident.getSubcategory());
        if (incident.getPriority() != null) body.put("priority", mapPriority(incident.getPriority()));
        if (incident.getDepartment() != null) body.put("department", incident.getDepartment());
        if (incident.getCallerEmail() != null) body.put("caller_email", incident.getCallerEmail());
        if (incident.getAssignedGroup() != null) body.put("assignment_group", incident.getAssignedGroup());

        JsonNode response = post(url, body);
        return mapIncidentFromJson(response.path("result"));
    }

    public Incident createIncidentFallback(Incident incident, Throwable throwable) {
        log.error("[ServiceNow] Fallback: createIncident failed: {}", throwable.getMessage());
        incident.setSysId("sys_id_queued_offline");
        incident.setNumber("INC-QUEUED-OFFLINE");
        incident.setState("Queued");
        return incident;
    }

    // ──────────────────────── UPDATE INCIDENT ────────────────────────

    @Override
    @CircuitBreaker(name = "serviceNowApi", fallbackMethod = "updateIncidentFallback")
    @Retry(name = "serviceNowApi")
    public Incident updateIncident(String sysId, Map<String, Object> fields) {
        String url = buildTableUrl("incident") + "/" + sysId;
        log.info("[ServiceNow] PUT {} fields={}", url, fields.keySet());

        JsonNode response = put(url, fields);
        return mapIncidentFromJson(response.path("result"));
    }

    public Incident updateIncidentFallback(String sysId, Map<String, Object> fields, Throwable throwable) {
        log.error("[ServiceNow] Fallback: updateIncident {} failed: {}", sysId, throwable.getMessage());
        Incident incident = new Incident();
        incident.setSysId(sysId);
        incident.setState("UpdateQueued");
        return incident;
    }

    // ──────────────────────── GET INCIDENT BY SYS_ID ────────────────────────

    @Override
    public Optional<Incident> getIncidentBySysId(String sysId) {
        String url = buildTableUrl("incident") + "/" + sysId;
        log.info("[ServiceNow] GET {}", url);

        try {
            JsonNode result = get(url).path("result");
            if (result.isMissingNode()) return Optional.empty();
            return Optional.of(mapIncidentFromJson(result));
        } catch (Exception e) {
            log.error("[ServiceNow] Failed to fetch incident {}: {}", sysId, e.getMessage());
            return Optional.empty();
        }
    }

    // ──────────────────────── FETCH RESOLVED INCIDENTS (INCREMENTAL) ────────────────────────

    @Override
    @CircuitBreaker(name = "serviceNowApi", fallbackMethod = "fetchResolvedIncidentsFallback")
    @Retry(name = "serviceNowApi")
    public List<Incident> fetchResolvedIncidentsSince(Instant updatedSince, int limit, int offset) {
        String query = "state=6^ORstate=7^sys_updated_on>=" + snFormatter.format(updatedSince);
        String url = UriComponentsBuilder.fromHttpUrl(buildTableUrl("incident"))
            .queryParam("sysparm_query", query)
            .queryParam("sysparm_limit", limit)
            .queryParam("sysparm_offset", offset)
            .queryParam("sysparm_display_value", "false")
            .queryParam("sysparm_fields", "sys_id,number,short_description,description,category,subcategory,priority,state,resolution_notes,assignment_group,caller_id,department,sys_created_on,sys_updated_on")
            .toUriString();

        log.info("[ServiceNow] GET {} (limit={}, offset={})", url, limit, offset);

        JsonNode result = get(url).path("result");
        List<Incident> incidents = new ArrayList<>();
        if (result.isArray()) {
            for (JsonNode node : result) {
                incidents.add(mapIncidentFromJson(node));
            }
        }
        log.info("[ServiceNow] Fetched {} resolved incidents since {}", incidents.size(), updatedSince);
        return incidents;
    }

    public List<Incident> fetchResolvedIncidentsFallback(Instant updatedSince, int limit, int offset, Throwable throwable) {
        log.error("[ServiceNow] Fallback: fetchResolvedIncidents failed: {}", throwable.getMessage());
        return List.of();
    }

    // ──────────────────────── FETCH KB ARTICLES (INCREMENTAL) ────────────────────────

    @Override
    @CircuitBreaker(name = "serviceNowApi", fallbackMethod = "fetchKnowledgeArticlesFallback")
    @Retry(name = "serviceNowApi")
    public List<KnowledgeRecord> fetchKnowledgeArticlesSince(Instant updatedSince, int limit, int offset) {
        String query = "workflow_state=published^sys_updated_on>=" + snFormatter.format(updatedSince);
        String url = UriComponentsBuilder.fromHttpUrl(buildTableUrl("kb_knowledge"))
            .queryParam("sysparm_query", query)
            .queryParam("sysparm_limit", limit)
            .queryParam("sysparm_offset", offset)
            .queryParam("sysparm_display_value", "false")
            .queryParam("sysparm_fields", "sys_id,number,title,short_description,body,workflow_state,kb_category,priority,assignment_group,sys_created_on,sys_updated_on")
            .toUriString();

        log.info("[ServiceNow] GET {} (limit={}, offset={})", url, limit, offset);

        JsonNode result = get(url).path("result");
        List<KnowledgeRecord> records = new ArrayList<>();
        if (result.isArray()) {
            for (JsonNode node : result) {
                records.add(mapKnowledgeArticleFromJson(node));
            }
        }
        log.info("[ServiceNow] Fetched {} KB articles since {}", records.size(), updatedSince);
        return records;
    }

    public List<KnowledgeRecord> fetchKnowledgeArticlesFallback(Instant updatedSince, int limit, int offset, Throwable throwable) {
        log.error("[ServiceNow] Fallback: fetchKnowledgeArticles failed: {}", throwable.getMessage());
        return List.of();
    }

    // ──────────────────────── FETCH ALL RESOLVED (INCIDENTS + KB) ────────────────────────

    @Override
    public Optional<KnowledgeRecord> getKnowledgeRecordBySysId(String sysId) {
        // Try incident first
        Optional<Incident> incident = getIncidentBySysId(sysId);
        if (incident.isPresent()) {
            Incident inc = incident.get();
            return Optional.of(KnowledgeRecord.builder()
                .recordSysId(inc.getSysId())
                .recordNumber(inc.getNumber())
                .title(inc.getTitle())
                .description(inc.getDescription())
                .resolutionNotes(inc.getResolutionNotes())
                .category(inc.getCategory())
                .priority(inc.getPriority())
                .assignmentGroup(inc.getAssignedGroup())
                .department(inc.getDepartment())
                .recordType("INCIDENT")
                .state(inc.getState())
                .sysUpdatedOn(inc.getSysUpdatedOn())
                .build());
        }

        // Try KB article if incident not found
        String url = UriComponentsBuilder.fromHttpUrl(buildTableUrl("kb_knowledge"))
            .pathSegment(sysId)
            .queryParam("sysparm_display_value", "false")
            .toUriString();

        try {
            JsonNode result = get(url).path("result");
            if (!result.isMissingNode() && !result.isNull()) {
                KnowledgeRecord record = KnowledgeRecord.builder()
                    .recordSysId(result.path("sys_id").asText(null))
                    .recordNumber(result.path("number").asText(null))
                    .title(result.path("short_description").asText(null))
                    .description(result.path("body").asText(null))
                    .category(result.path("kb_category").asText(null))
                    .priority(result.path("priority").asText(null))
                    .assignmentGroup(result.path("assignment_group").asText(null))
                    .recordType("KNOWLEDGE_ARTICLE")
                    .state(result.path("workflow_state").asText(null))
                    .build();
                return Optional.of(record);
            }
        } catch (Exception e) {
            log.warn("[ServiceNow] getKnowledgeRecordBySysId failed for kb_knowledge {}: {}", sysId, e.getMessage());
        }

        return Optional.empty();
    }

    @Override
    public List<KnowledgeRecord> fetchAllResolvedKnowledgeRecordsSince(Instant updatedSince, int limit, int offset) {
        List<KnowledgeRecord> records = new ArrayList<>();

        int halfLimit = Math.max(1, limit / 2);

        // Fetch resolved incidents and convert to KnowledgeRecords
        List<Incident> incidents = fetchResolvedIncidentsSince(updatedSince, halfLimit, offset / 2);
        for (Incident inc : incidents) {
            records.add(KnowledgeRecord.builder()
                .recordSysId(inc.getSysId())
                .recordNumber(inc.getNumber())
                .title(inc.getTitle())
                .description(inc.getDescription())
                .resolutionNotes(inc.getResolutionNotes())
                .category(inc.getCategory() != null ? inc.getCategory() : "General IT")
                .priority(inc.getPriority() != null ? inc.getPriority() : "3 - Moderate")
                .assignmentGroup(inc.getAssignedGroup())
                .department(inc.getDepartment() != null ? inc.getDepartment() : "Global Service Desk")
                .workspace("Enterprise IT")
                .recordType("INCIDENT")
                .state(inc.getState())
                .connectorType("SERVICENOW")
                .sysCreatedOn(inc.getSysCreatedOn())
                .sysUpdatedOn(inc.getSysUpdatedOn())
                .attachments(fetchAttachmentsMetadataForRecord("incident", inc.getSysId()))
                .build());
        }

        // Fetch published KB articles
        records.addAll(fetchKnowledgeArticlesSince(updatedSince, halfLimit, offset / 2));

        log.info("[ServiceNow] Total unified knowledge records: {} ({} incidents + {} KB)",
            records.size(), incidents.size(), records.size() - incidents.size());
        return records;
    }

    // ──────────────────────── SEARCH SIMILAR INCIDENTS ────────────────────────

    @Override
    public List<Incident> searchSimilarIncidents(String queryText, int maxResults) {
        String query = "state=6^ORstate=7^short_descriptionLIKE" + queryText;
        String url = UriComponentsBuilder.fromHttpUrl(buildTableUrl("incident"))
            .queryParam("sysparm_query", query)
            .queryParam("sysparm_limit", maxResults)
            .queryParam("sysparm_fields", "sys_id,number,short_description,description,resolution_notes,category,priority,state,assignment_group,sys_created_on")
            .toUriString();

        log.info("[ServiceNow] GET {} (search='{}')", url, queryText);

        try {
            JsonNode result = get(url).path("result");
            List<Incident> incidents = new ArrayList<>();
            if (result.isArray()) {
                for (JsonNode node : result) {
                    incidents.add(mapIncidentFromJson(node));
                }
            }
            return incidents;
        } catch (Exception e) {
            log.error("[ServiceNow] Search failed: {}", e.getMessage());
            return List.of();
        }
    }

    // ──────────────────────── VALIDATE CONNECTION ────────────────────────

    @Override
    public boolean validateConnection() {
        try {
            String url = buildTableUrl("core_company") + "?sysparm_limit=1";
            log.info("[ServiceNow] Validating connection: GET {}", url);
            get(url);
            log.info("[ServiceNow] Connection validated successfully");
            return true;
        } catch (Exception e) {
            log.error("[ServiceNow] Connection validation failed: {}", e.getMessage());
            return false;
        }
    }

    // ──────────────────────── ATTACHMENTS ────────────────────────

    @Override
    public List<AttachmentMetadata> fetchAttachmentsMetadataForRecord(String tableName, String recordSysId) {
        String query = "table_name=" + tableName + "^table_sys_id=" + recordSysId;
        String url = UriComponentsBuilder.fromHttpUrl(buildTableUrl("sys_attachment"))
            .queryParam("sysparm_query", query)
            .queryParam("sysparm_fields", "sys_id,file_name,content_type,size_bytes,table_name,table_sys_id,sys_created_on")
            .toUriString();

        log.debug("[ServiceNow] GET {} (attachments for {}:{})", url, tableName, recordSysId);

        try {
            JsonNode result = get(url).path("result");
            List<AttachmentMetadata> attachments = new ArrayList<>();
            if (result.isArray()) {
                for (JsonNode node : result) {
                    attachments.add(AttachmentMetadata.builder()
                        .attachmentSysId(node.path("sys_id").asText())
                        .fileName(node.path("file_name").asText())
                        .mimeType(node.path("content_type").asText())
                        .fileSize(node.path("size_bytes").asLong())
                        .tableName(node.path("table_name").asText())
                        .recordSysId(node.path("table_sys_id").asText())
                        .downloadUrl(config.getInstanceUrl() + "/api/now/attachment/" + node.path("sys_id").asText() + "/file")
                        .createdOn(parseServiceNowDate(node.path("sys_created_on").asText("")))
                        .build());
                }
            }
            return attachments;
        } catch (Exception e) {
            log.warn("[ServiceNow] Failed to fetch attachments for {}:{}: {}", tableName, recordSysId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public AttachmentMetadata getAttachmentMetadata(String attachmentId) {
        String url = buildTableUrl("sys_attachment") + "/" + attachmentId;
        log.info("[ServiceNow] GET {}", url);

        try {
            JsonNode result = get(url).path("result");
            return AttachmentMetadata.builder()
                .attachmentSysId(result.path("sys_id").asText())
                .fileName(result.path("file_name").asText())
                .mimeType(result.path("content_type").asText())
                .fileSize(result.path("size_bytes").asLong())
                .tableName(result.path("table_name").asText())
                .recordSysId(result.path("table_sys_id").asText())
                .downloadUrl(config.getInstanceUrl() + "/api/now/attachment/" + attachmentId + "/file")
                .createdOn(Instant.parse(result.path("created_on").asText("")))
                .build();
        } catch (Exception e) {
            log.error("[ServiceNow] Failed to get attachment metadata {}: {}", attachmentId, e.getMessage());
            throw new RuntimeException("Failed to fetch attachment metadata: " + e.getMessage(), e);
        }
    }

    @Override
    @CircuitBreaker(name = "serviceNowApi", fallbackMethod = "downloadAttachmentFallback")
    @Retry(name = "serviceNowApi")
    public byte[] downloadAttachmentContent(String attachmentId) {
        String url = config.getInstanceUrl() + "/api/now/attachment/" + attachmentId + "/file";
        log.info("[ServiceNow] GET {} (binary download)", url);

        RestTemplate rest = createRestTemplate();
        HttpHeaders headers = createAuthHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_OCTET_STREAM));

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<byte[]> response = rest.exchange(url, HttpMethod.GET, request, byte[].class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            log.info("[ServiceNow] Downloaded {} bytes for attachment {}", response.getBody().length, attachmentId);
            return response.getBody();
        }
        throw new RuntimeException("Failed to download attachment: " + response.getStatusCode());
    }

    public byte[] downloadAttachmentFallback(String attachmentId, Throwable throwable) {
        log.error("[ServiceNow] Fallback: downloadAttachment {} failed: {}", attachmentId, throwable.getMessage());
        return new byte[0];
    }

    // ──────────────────────── HTTP HELPERS ────────────────────────

    private JsonNode get(String url) {
        RestTemplate rest = createRestTemplate();
        HttpHeaders headers = createAuthHeaders();
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<String> response = rest.exchange(url, HttpMethod.GET, request, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                return objectMapper.readTree(response.getBody());
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse ServiceNow response", e);
            }
        }
        throw new RuntimeException("ServiceNow GET failed: " + response.getStatusCode());
    }

    private JsonNode post(String url, Map<String, Object> body) {
        RestTemplate rest = createRestTemplate();
        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            ResponseEntity<String> response = rest.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return objectMapper.readTree(response.getBody());
            }
            throw new RuntimeException("ServiceNow POST failed: " + response.getStatusCode());
        } catch (Exception e) {
            throw new RuntimeException("ServiceNow POST failed: " + e.getMessage(), e);
        }
    }

    private JsonNode put(String url, Map<String, Object> body) {
        RestTemplate rest = createRestTemplate();
        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);
            ResponseEntity<String> response = rest.exchange(url, HttpMethod.PUT, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return objectMapper.readTree(response.getBody());
            }
            throw new RuntimeException("ServiceNow PUT failed: " + response.getStatusCode());
        } catch (Exception e) {
            throw new RuntimeException("ServiceNow PUT failed: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String token = oAuth2Client.getValidAccessToken();
        headers.setBearerAuth(token);
        return headers;
    }

    private String buildTableUrl(String tableName) {
        return config.getInstanceUrl() + "/api/now/table/" + tableName;
    }

    private RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(config.getConnectionTimeoutMs());
        factory.setReadTimeout(config.getReadTimeoutMs());
        return new RestTemplate(factory);
    }

    // ──────────────────────── MAPPERS ────────────────────────

    private Incident mapIncidentFromJson(JsonNode node) {
        return Incident.builder()
            .sysId(node.path("sys_id").asText())
            .number(node.path("number").asText())
            .title(node.path("short_description").asText())
            .description(node.path("description").asText(""))
            .category(node.path("category").asText(""))
            .subcategory(node.path("subcategory").asText(""))
            .priority(mapPriorityReverse(node.path("priority").asText()))
            .state(node.path("state").asText(""))
            .resolutionNotes(node.path("resolution_notes").asText(""))
            .assignedGroup(node.path("assignment_group").asText(""))
            .callerEmail(node.path("caller_id").asText(""))
            .department(node.path("department").asText(""))
            .sysCreatedOn(parseInstant(node.path("sys_created_on").asText("")))
            .sysUpdatedOn(parseInstant(node.path("sys_updated_on").asText("")))
            .build();
    }

    private KnowledgeRecord mapKnowledgeArticleFromJson(JsonNode node) {
        return KnowledgeRecord.builder()
            .recordSysId(node.path("sys_id").asText())
            .recordNumber(node.path("number").asText())
            .title(node.path("title").asText())
            .description(node.path("short_description").asText("") + "\n" + stripHtml(node.path("body").asText("")))
            .category(node.path("kb_category").asText("General"))
            .priority(node.path("priority").asText("3 - Moderate"))
            .assignmentGroup(node.path("assignment_group").asText(""))
            .workspace("Enterprise IT")
            .department("Knowledge Management")
            .recordType("KNOWLEDGE_ARTICLE")
            .state(node.path("workflow_state").asText("published"))
            .connectorType("SERVICENOW")
            .sysCreatedOn(parseInstant(node.path("sys_created_on").asText("")))
            .sysUpdatedOn(parseInstant(node.path("sys_updated_on").asText("")))
            .build();
    }

    private String mapPriority(String priority) {
        if (priority == null) return "3";
        if (priority.contains("1") || priority.toLowerCase().contains("critical")) return "1";
        if (priority.contains("2") || priority.toLowerCase().contains("high")) return "2";
        if (priority.contains("3") || priority.toLowerCase().contains("moderate")) return "3";
        if (priority.contains("4") || priority.toLowerCase().contains("low")) return "4";
        return "3";
    }

    private String mapPriorityReverse(String snPriority) {
        return switch (snPriority) {
            case "1" -> "1 - Critical";
            case "2" -> "2 - High";
            case "3" -> "3 - Moderate";
            case "4" -> "4 - Low";
            default -> snPriority;
        };
    }

    private Instant parseServiceNowDate(String value) {
        if (value == null || value.isEmpty()) return Instant.EPOCH;
        try {
            return java.time.LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).toInstant(ZoneOffset.UTC);
        } catch (Exception e) {
            try {
                return Instant.parse(value);
            } catch (Exception ex) {
                try {
                    return DateTimeFormatter.ISO_LOCAL_DATE_TIME.parse(value, java.time.LocalDateTime::from).toInstant(ZoneOffset.UTC);
                } catch (Exception ex2) {
                    return Instant.EPOCH;
                }
            }
        }
    }

    private Instant parseInstant(String value) {
        return parseServiceNowDate(value);
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
    }
}
