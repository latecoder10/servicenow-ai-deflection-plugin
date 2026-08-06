package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "knowledge_documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocumentEntity extends AuditableEntity {

    @Column(name = "workspace_id")
    private UUID workspaceId;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "source_type", length = 50)
    private String sourceType;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "checksum", length = 64)
    private String checksum;

    @Column(name = "quality_score")
    private Integer qualityScore;

    @Column(name = "status", length = 50)
    private String status;
}
