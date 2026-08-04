package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.KnowledgeDocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeDocumentJpaRepository extends JpaRepository<KnowledgeDocumentEntity, UUID>, JpaSpecificationExecutor<KnowledgeDocumentEntity> {
    Optional<KnowledgeDocumentEntity> findByChecksumAndSoftDeleteFalse(String checksum);
    Page<KnowledgeDocumentEntity> findByStatusAndSoftDeleteFalse(String status, Pageable pageable);
    List<KnowledgeDocumentEntity> findByDepartmentIdAndSoftDeleteFalse(UUID departmentId);
    List<KnowledgeDocumentEntity> findByWorkspaceIdAndSoftDeleteFalse(UUID workspaceId);
}
