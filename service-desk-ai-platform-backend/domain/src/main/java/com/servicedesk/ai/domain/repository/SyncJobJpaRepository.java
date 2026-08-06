package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.SyncJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyncJobJpaRepository extends JpaRepository<SyncJobEntity, UUID> {
    Optional<SyncJobEntity> findByJobId(String jobId);
    List<SyncJobEntity> findTop10ByOrderByStartedAtDesc();
    List<SyncJobEntity> findByConnectorTypeOrderByStartedAtDesc(String connectorType);
}
