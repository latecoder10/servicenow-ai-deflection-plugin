package com.servicedesk.ai.application.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.domain.model.Incident;
import com.servicedesk.ai.domain.port.out.ServiceNowPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyntheticDataLoader {

    private final ServiceNowPort serviceNowPort;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LoadResult pushIncidentsToServiceNow() {
        long startTime = System.currentTimeMillis();
        AtomicInteger created = new AtomicInteger();
        AtomicInteger resolved = new AtomicInteger();
        AtomicInteger failed = new AtomicInteger();

        try {
            List<Map<String, String>> tickets = readTickets();
            log.info("[Synthetic Loader] Loaded {} tickets from JSON, pushing to ServiceNow", tickets.size());

            for (Map<String, String> ticket : tickets) {
                try {
                    Incident incident = toIncident(ticket);
                    Incident createdIncident = serviceNowPort.createIncident(incident);

                    if (createdIncident.getSysId() != null && !createdIncident.getSysId().equals("sys_id_queued_offline")) {
                        created.incrementAndGet();
                        log.info("[Synthetic Loader] Created {} ({})", createdIncident.getNumber(), ticket.get("short_description"));

                        try {
                            Map<String, Object> updateFields = new LinkedHashMap<>();
                            updateFields.put("state", "6");
                            updateFields.put("close_code", "Closed/Resolved by Caller");
                            updateFields.put("close_notes", ticket.getOrDefault("resolution", "Issue resolved."));

                            serviceNowPort.updateIncident(createdIncident.getSysId(), updateFields);
                            resolved.incrementAndGet();
                            log.info("[Synthetic Loader] Resolved {}", createdIncident.getNumber());
                        } catch (Exception updateEx) {
                            log.warn("[Synthetic Loader] Created {} but failed to resolve: {}", createdIncident.getNumber(), updateEx.getMessage());
                        }
                    } else {
                        failed.incrementAndGet();
                        log.warn("[Synthetic Loader] Failed to create {}: {}", ticket.get("number"), createdIncident.getNumber());
                    }

                    Thread.sleep(500);
                } catch (Exception e) {
                    failed.incrementAndGet();
                    log.error("[Synthetic Loader] Error processing {}: {}", ticket.get("number"), e.getMessage());
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("[Synthetic Loader] Completed: created={}, resolved={}, failed={}, duration={}ms",
                created.get(), resolved.get(), failed.get(), duration);

            return new LoadResult(created.get(), resolved.get(), failed.get(), duration);

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[Synthetic Loader] Failed: {}", e.getMessage(), e);
            return new LoadResult(0, 0, 0, duration);
        }
    }

    private List<Map<String, String>> readTickets() throws Exception {
        ClassPathResource resource = new ClassPathResource("data/synthetic-incidents.json");
        try (InputStream is = resource.getInputStream()) {
            return objectMapper.readValue(is, new TypeReference<>() {});
        }
    }

    private Incident toIncident(Map<String, String> ticket) {
        String priorityStr = mapPriority(ticket.getOrDefault("urgency", "2"), ticket.getOrDefault("impact", "2"));

        return Incident.builder()
            .title(ticket.get("short_description"))
            .description(ticket.get("description"))
            .category(ticket.get("category"))
            .assignedGroup(ticket.get("assignment_group"))
            .priority(priorityStr)
            .state("New")
            .build();
    }

    private String mapPriority(String urgency, String impact) {
        int u = Integer.parseInt(urgency);
        int i = Integer.parseInt(impact);
        int total = u + i;
        if (total >= 5) return "1 - Critical";
        if (total >= 3) return "2 - High";
        return "3 - Moderate";
    }

    public record LoadResult(int created, int resolved, int failed, long durationMs) {}
}
