package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.AttachmentMetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttachmentMetadataJpaRepository extends JpaRepository<AttachmentMetadataEntity, UUID> {
    Optional<AttachmentMetadataEntity> findByAttachmentId(String attachmentId);
    List<AttachmentMetadataEntity> findByRecordSysId(String recordSysId);
    List<AttachmentMetadataEntity> findByTableNameAndRecordSysId(String tableName, String recordSysId);
}
