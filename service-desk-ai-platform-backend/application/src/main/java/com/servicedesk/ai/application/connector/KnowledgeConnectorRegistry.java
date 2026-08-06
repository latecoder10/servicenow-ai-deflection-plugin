package com.servicedesk.ai.application.connector;

import com.servicedesk.ai.domain.port.out.KnowledgeConnector;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry holding available enterprise knowledge connectors (ServiceNow, Jira, Confluence, SharePoint).
 */
@Slf4j
@Component
public class KnowledgeConnectorRegistry {

    private final Map<String, KnowledgeConnector> connectorMap = new ConcurrentHashMap<>();

    public KnowledgeConnectorRegistry(List<KnowledgeConnector> connectors) {
        for (KnowledgeConnector connector : connectors) {
            String type = connector.getConnectorType().toUpperCase();
            connectorMap.put(type, connector);
            log.info("[Connector Registry] Registered connector type: {}", type);
        }
    }

    public Optional<KnowledgeConnector> getConnector(String connectorType) {
        if (connectorType == null) return Optional.empty();
        return Optional.ofNullable(connectorMap.get(connectorType.toUpperCase()));
    }

    public List<String> getAvailableConnectorTypes() {
        return List.copyOf(connectorMap.keySet());
    }
}
