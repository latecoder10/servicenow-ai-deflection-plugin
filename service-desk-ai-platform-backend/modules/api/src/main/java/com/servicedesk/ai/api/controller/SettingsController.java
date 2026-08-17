package com.servicedesk.ai.api.controller;

import com.servicedesk.ai.domain.settings.PlatformSettingsService;
import com.servicedesk.ai.domain.settings.SettingsCatalog;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Runtime configuration, so an operator changes the Drive folder or the sync schedule
 * from the UI rather than by editing .env and redeploying.
 *
 * <p>Only keys declared in {@link SettingsCatalog} are readable or writable here.
 * Secrets are not in that catalogue and so cannot be read or set through this API.
 */
@Slf4j
@Tag(name = "Platform Settings", description = "Runtime-editable platform configuration")
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final PlatformSettingsService settingsService;

    @Operation(summary = "List every configurable setting, grouped by category")
    @GetMapping
    public ResponseEntity<Map<String, Object>> listSettings() {
        Map<String, PlatformSettingsService.Resolved> resolved = settingsService.resolveAll();

        // Grouped for the UI, which renders one panel per category.
        Map<String, List<Map<String, Object>>> byCategory = new LinkedHashMap<>();
        for (PlatformSettingsService.Resolved r : resolved.values()) {
            SettingsCatalog.Setting s = r.setting();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("key", s.key());
            item.put("label", s.label());
            item.put("description", s.description());
            item.put("type", s.type().name());
            item.put("value", r.value());
            item.put("defaultValue", r.defaultValue());
            item.put("overridden", r.overridden());
            item.put("restartRequired", s.restartRequired());
            byCategory.computeIfAbsent(s.category(), k -> new ArrayList<>()).add(item);
        }

        List<Map<String, Object>> categories = new ArrayList<>();
        byCategory.forEach((name, items) -> {
            Map<String, Object> group = new LinkedHashMap<>();
            group.put("category", name);
            group.put("settings", items);
            categories.add(group);
        });

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("categories", categories);
        body.put("settingCount", resolved.size());
        body.put("overriddenCount", resolved.values().stream().filter(
            PlatformSettingsService.Resolved::overridden).count());
        // Stated in the payload so the UI never has to hardcode the policy.
        body.put("note", "Secrets and datasource credentials are intentionally not "
            + "configurable here and remain in the environment.");
        return ResponseEntity.ok(body);
    }

    @Operation(summary = "Update one or more settings")
    @PutMapping
    public ResponseEntity<Map<String, Object>> updateSettings(
            @RequestBody Map<String, String> updates,
            @RequestHeader(name = "X-User", required = false) String actor) {

        if (updates == null || updates.isEmpty()) {
            throw new IllegalArgumentException("No settings supplied");
        }

        // Validate the whole batch before writing any of it, so a typo in the last field
        // cannot leave the first half applied and the rest not.
        updates.forEach((key, value) -> {
            if (!SettingsCatalog.isKnown(key)) {
                throw new IllegalArgumentException("Unknown setting: " + key);
            }
        });

        List<String> restartNeeded = new ArrayList<>();
        updates.forEach((key, value) -> {
            settingsService.put(key, value, actor);
            SettingsCatalog.find(key)
                .filter(SettingsCatalog.Setting::restartRequired)
                .ifPresent(s -> restartNeeded.add(s.label()));
        });

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "SAVED");
        body.put("updated", updates.size());
        body.put("restartRequired", restartNeeded);
        body.put("message", restartNeeded.isEmpty()
            ? "Settings applied immediately"
            : "Saved. These take effect after a restart: " + String.join(", ", restartNeeded));
        return ResponseEntity.ok(body);
    }

    @Operation(summary = "Clear an override so the environment value applies again")
    @DeleteMapping("/{key}")
    public ResponseEntity<Map<String, Object>> resetSetting(@PathVariable(name = "key") String key) {
        settingsService.reset(key);
        return ResponseEntity.ok(Map.of(
            "status", "RESET",
            "key", key,
            "message", "The environment value now applies again"
        ));
    }
}
