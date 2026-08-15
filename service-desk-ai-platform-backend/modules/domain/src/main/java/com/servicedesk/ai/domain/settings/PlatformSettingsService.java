package com.servicedesk.ai.domain.settings;

import com.servicedesk.ai.domain.entity.PlatformSettingEntity;
import com.servicedesk.ai.domain.repository.PlatformSettingJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolves configuration as an override layer: the database first, then the Spring
 * property the setting shadows.
 *
 * <p>That ordering is what makes this safe to add to a running system. A key with no row
 * behaves exactly as it did before, so an empty table is a no-op and nothing has to be
 * migrated out of the environment to keep working.
 *
 * <p>Values are cached because callers read them on hot paths - the scheduler on every
 * run, analytics on every dashboard request. The cache is invalidated on write rather
 * than expiring on a timer, so an admin's change is visible immediately.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformSettingsService {

    private final PlatformSettingJpaRepository repository;
    private final Environment environment;

    /** Key to resolved value. Absent means "not looked up yet", not "no override". */
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    // ------------------------------------------------------------- reads

    /**
     * The effective value: the stored override, or the Spring property, or the fallback.
     * Never throws - a settings lookup failing must not take down the caller.
     */
    public String getString(String key, String fallback) {
        try {
            String cached = cache.get(key);
            if (cached != null) {
                return cached;
            }
            String value = repository.findBySettingKey(key)
                .map(PlatformSettingEntity::getSettingValue)
                .filter(v -> v != null && !v.isBlank())
                .orElseGet(() -> springValue(key));

            if (value == null) {
                return fallback;
            }
            cache.put(key, value);
            return value;
        } catch (Exception e) {
            // A database blip must not change behaviour, so fall back rather than fail.
            log.warn("Could not resolve setting '{}', using the fallback: {}", key, e.getMessage());
            return fallback;
        }
    }

    public boolean getBoolean(String key, boolean fallback) {
        String value = getString(key, String.valueOf(fallback));
        return "true".equalsIgnoreCase(value.trim());
    }

    public int getInt(String key, int fallback) {
        String value = getString(key, String.valueOf(fallback));
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            log.warn("Setting '{}' is not an integer ('{}'), using {}", key, value, fallback);
            return fallback;
        }
    }

    public double getDouble(String key, double fallback) {
        String value = getString(key, String.valueOf(fallback));
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            log.warn("Setting '{}' is not a number ('{}'), using {}", key, value, fallback);
            return fallback;
        }
    }

    /** Every catalogued setting with its effective value and whether it is overridden. */
    public Map<String, Resolved> resolveAll() {
        Map<String, String> overrides = new LinkedHashMap<>();
        try {
            repository.findBySoftDeleteFalse().forEach(row ->
                overrides.put(row.getSettingKey(), row.getSettingValue()));
        } catch (Exception e) {
            log.warn("Could not read stored settings, reporting defaults only: {}", e.getMessage());
        }

        Map<String, Resolved> resolved = new LinkedHashMap<>();
        for (SettingsCatalog.Setting setting : SettingsCatalog.ALL) {
            String defaultValue = springValue(setting.springProperty());
            String override = overrides.get(setting.key());
            boolean isOverridden = override != null && !override.isBlank();
            resolved.put(setting.key(), new Resolved(
                setting,
                isOverridden ? override : defaultValue,
                defaultValue,
                isOverridden
            ));
        }
        return resolved;
    }

    public record Resolved(SettingsCatalog.Setting setting, String value,
                           String defaultValue, boolean overridden) {}

    // ------------------------------------------------------------- writes

    /**
     * Stores an override. A blank value clears it, which is the same as pressing reset -
     * the setting reverts to whatever the environment supplies.
     */
    @Transactional
    public void put(String key, String value, String actor) {
        if (!SettingsCatalog.isKnown(key)) {
            throw new IllegalArgumentException("Unknown setting: " + key);
        }
        validate(key, value);

        if (value == null || value.isBlank()) {
            reset(key);
            return;
        }

        PlatformSettingEntity row = repository.findBySettingKey(key)
            .orElseGet(PlatformSettingEntity::new);
        if (row.getId() == null) {
            row.setCreatedBy(actor != null ? actor : "system");
        }
        row.setSettingKey(key);
        row.setSettingValue(value.trim());
        row.setUpdatedBy(actor != null ? actor : "system");
        repository.save(row);

        cache.put(key, value.trim());
        log.info("Setting '{}' updated by {}", key, actor);
    }

    /** Drops the override so the environment value applies again. */
    @Transactional
    public void reset(String key) {
        if (!SettingsCatalog.isKnown(key)) {
            throw new IllegalArgumentException("Unknown setting: " + key);
        }
        repository.findBySettingKey(key).ifPresent(repository::delete);
        cache.remove(key);
        log.info("Setting '{}' reset to its environment value", key);
    }

    /** Rejects a value the typed getters would silently fall back on later. */
    private void validate(String key, String value) {
        if (value == null || value.isBlank()) {
            return;   // clearing is always allowed
        }
        SettingsCatalog.Setting setting = SettingsCatalog.find(key).orElseThrow();
        String trimmed = value.trim();
        switch (setting.type()) {
            case INTEGER -> {
                try {
                    Integer.parseInt(trimmed);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException(setting.label() + " must be a whole number");
                }
            }
            case DECIMAL -> {
                try {
                    Double.parseDouble(trimmed);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException(setting.label() + " must be a number");
                }
            }
            case BOOLEAN -> {
                if (!"true".equalsIgnoreCase(trimmed) && !"false".equalsIgnoreCase(trimmed)) {
                    throw new IllegalArgumentException(setting.label() + " must be true or false");
                }
            }
            case STRING -> { /* nothing to check */ }
        }
    }

    private String springValue(String property) {
        return environment.getProperty(property);
    }
}
