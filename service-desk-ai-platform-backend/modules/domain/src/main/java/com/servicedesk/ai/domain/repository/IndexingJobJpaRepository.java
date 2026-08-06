package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.IndexingJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IndexingJobJpaRepository extends JpaRepository<IndexingJobEntity, UUID> {
    List<IndexingJobEntity> findByStatus(String status);
    List<IndexingJobEntity> findByDocumentId(UUID documentId);
}
