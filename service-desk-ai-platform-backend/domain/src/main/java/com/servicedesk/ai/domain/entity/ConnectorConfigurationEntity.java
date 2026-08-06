package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "connector_configurations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectorConfigurationEntity extends AuditableEntity {

    @Column(name = "connector_type", length = 50, nullable = false, unique = true)
    private String connectorType; // e.g., SERVICENOW, JIRA, CONFLUENCE, SHAREPOINT

    @Column(name = "instance_url", length = 255, nullable = false)
    private String instanceUrl;

    @Column(name = "client_id", length = 255)
    private String clientId;

    @Column(name = "client_secret_encrypted", length = 500)
    private String clientSecretEncrypted;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "workspace", length = 100)
    private String workspace;

    @Column(name = "settings_json", columnDefinition = "TEXT")
    private String settingsJson;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;
}
