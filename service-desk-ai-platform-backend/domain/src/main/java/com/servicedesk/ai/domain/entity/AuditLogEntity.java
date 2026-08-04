package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity extends AuditableEntity {

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "principal", length = 150)
    private String principal;

    @Column(name = "action", length = 100)
    private String action;

    @Column(name = "resource_type", length = 100)
    private String resourceType;

    @Column(name = "resource_id", length = 100)
    private String resourceId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}
