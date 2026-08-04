package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "departments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentEntity extends AuditableEntity {

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;
}
