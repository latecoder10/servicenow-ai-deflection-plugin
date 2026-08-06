package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogJpaRepository extends JpaRepository<AuditLogEntity, UUID> {
    Page<AuditLogEntity> findByEventType(String eventType, Pageable pageable);
    Page<AuditLogEntity> findByPrincipal(String principal, Pageable pageable);
}
