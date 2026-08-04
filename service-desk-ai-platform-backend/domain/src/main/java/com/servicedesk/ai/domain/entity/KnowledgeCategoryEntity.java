package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "knowledge_categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeCategoryEntity extends AuditableEntity {

    @Column(name = "workspace_id")
    private UUID workspaceId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", length = 100)
    private String slug;
}
