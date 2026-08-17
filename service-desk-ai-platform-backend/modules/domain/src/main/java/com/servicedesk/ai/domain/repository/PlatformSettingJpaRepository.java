package com.servicedesk.ai.domain.repository;

import com.servicedesk.ai.domain.entity.PlatformSettingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformSettingJpaRepository extends JpaRepository<PlatformSettingEntity, UUID> {
    Optional<PlatformSettingEntity> findBySettingKey(String settingKey);
    List<PlatformSettingEntity> findBySoftDeleteFalse();
    void deleteBySettingKey(String settingKey);
}
