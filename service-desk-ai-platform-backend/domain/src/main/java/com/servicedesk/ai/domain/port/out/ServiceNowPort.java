package com.servicedesk.ai.domain.port.out;

import com.servicedesk.ai.domain.model.Incident;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ServiceNowPort {
    Incident createIncident(Incident incident);
    
    Optional<Incident> getIncidentBySysId(String sysId);
    
    List<Incident> fetchResolvedIncidentsSince(Instant updatedSince, int limit);
    
    List<Incident> searchSimilarIncidents(String queryText, int maxResults);
    
    boolean validateConnection();
}
