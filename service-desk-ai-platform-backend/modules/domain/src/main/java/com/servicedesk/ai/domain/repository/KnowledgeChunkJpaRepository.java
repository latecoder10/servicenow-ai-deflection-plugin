package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.KnowledgeChunkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeChunkJpaRepository extends JpaRepository<KnowledgeChunkEntity, UUID> {
    List<KnowledgeChunkEntity> findByDocumentIdOrderByChunkIndexAsc(UUID documentId);
    void deleteByDocumentId(UUID documentId);
}
