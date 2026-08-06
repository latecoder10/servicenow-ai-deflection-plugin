package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.UploadJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UploadJobJpaRepository extends JpaRepository<UploadJobEntity, UUID> {
    List<UploadJobEntity> findByStatus(String status);
    List<UploadJobEntity> findByDocumentId(UUID documentId);
}
