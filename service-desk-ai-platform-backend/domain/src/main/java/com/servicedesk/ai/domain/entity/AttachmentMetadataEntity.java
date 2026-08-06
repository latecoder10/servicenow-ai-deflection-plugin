package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attachment_metadata")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentMetadataEntity extends AuditableEntity {

    @Column(name = "attachment_id", length = 100, nullable = false, unique = true)
    private String attachmentId;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "table_name", length = 100, nullable = false)
    private String tableName;

    @Column(name = "record_sys_id", length = 100, nullable = false)
    private String recordSysId;

    @Column(name = "download_url", length = 500)
    private String downloadUrl;

    @Column(name = "connector_type", length = 50)
    private String connectorType;
}
