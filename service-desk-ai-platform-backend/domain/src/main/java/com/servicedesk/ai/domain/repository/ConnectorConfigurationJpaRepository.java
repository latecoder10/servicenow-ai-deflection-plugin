package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.ConnectorConfigurationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectorConfigurationJpaRepository extends JpaRepository<ConnectorConfigurationEntity, UUID> {
    Optional<ConnectorConfigurationEntity> findByConnectorType(String connectorType);
}
