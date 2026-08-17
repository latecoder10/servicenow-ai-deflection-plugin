package com.servicedesk.ai.domain.entity;

import com.servicedesk.ai.common.model.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * An admin's override of one configuration value.
 *
 * <p>Only the key and the value are stored. What the key means - its type, label,
 * category and default - is declared in code, so the set of configurable settings ships
 * with the application rather than being editable data that can drift away from it.
 */
@Entity
@Table(name = "platform_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSettingEntity extends AuditableEntity {

    @Column(name = "setting_key", length = 150, nullable = false, unique = true)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;
}
