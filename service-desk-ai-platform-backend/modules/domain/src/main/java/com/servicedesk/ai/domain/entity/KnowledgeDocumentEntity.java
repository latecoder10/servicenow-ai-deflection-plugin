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

    // ── Connector-synced records ──────────────────────────────────────────
    // Everything below is null for a plain file upload and populated for a record
    // pulled from ServiceNow or Drive, which previously had no Postgres row at all.

    @Column(name = "connector_type", length = 50)
    private String connectorType;

    /** The source system's own identifier: a ServiceNow sys_id, a Drive file id. */
    @Column(name = "external_id", length = 100)
    private String externalId;

    /** What a person calls the record: INC0000030, KB0000023, IT-007. */
    @Column(name = "external_number", length = 100)
    private String externalNumber;

    /** The documentId its vectors carry, joining this row to the Pinecone index. */
    @Column(name = "vector_document_id", length = 200)
    private String vectorDocumentId;

    @Column(name = "source_uri", length = 1000)
    private String sourceUri;

    @Column(name = "department_name", length = 150)
    private String departmentName;

    @Column(name = "category_name", length = 150)
    private String categoryName;

    @Column(name = "owner_email", length = 150)
    private String ownerEmail;

    @Column(name = "chunk_count")
    private Integer chunkCount;

    @Column(name = "last_indexed_at")
    private java.time.LocalDateTime lastIndexedAt;
}
