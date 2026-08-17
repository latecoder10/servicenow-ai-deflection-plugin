package com.servicedesk.ai.domain.settings;

import java.util.List;
import java.util.Optional;

/**
 * Everything an administrator is allowed to change at runtime.
 *
 * <p>Declared in code rather than seeded as data, so the set of known settings ships
 * with the build. An unknown key submitted to the settings API is rejected against this
 * list, which stops the table becoming a dumping ground of stale or invented keys.
 *
 * <p><b>What is deliberately absent.</b> No secrets: the Gemini and Pinecone API keys,
 * the ServiceNow client secret and password, and the datasource credentials all stay in
 * the environment. A secret stored here would be plaintext at rest and would follow
 * every database dump around; the datasource credentials additionally cannot live in
 * the database they are needed to open. Bootstrap values such as the server port are
 * absent for the same reason - they are read before this table can be queried.
 */
public final class SettingsCatalog {

    private SettingsCatalog() {}

    public enum Type { STRING, INTEGER, DECIMAL, BOOLEAN }

    /**
     * @param springProperty the property this overrides, which also supplies the default
     *                       when no row exists - so an empty table changes no behaviour
     * @param restartRequired true when Spring binds the value at startup and cannot pick
     *                        up a change until the application restarts
     */
    public record Setting(
        String key,
        String springProperty,
        Type type,
        String category,
        String label,
        String description,
        boolean restartRequired
    ) {}

    public static final List<Setting> ALL = List.of(

        // ── Google Drive ────────────────────────────────────────────────────
        new Setting("gdrive.enabled", "gdrive.enabled", Type.BOOLEAN,
            "Google Drive", "Connector enabled",
            "Turns the Google Drive connector and its scheduled sync on or off.", false),

        new Setting("gdrive.folder-id", "gdrive.folder-id", Type.STRING,
            "Google Drive", "Folder ID",
            "The Drive folder to index, including everything beneath it. Take the id "
                + "from the folder URL after /folders/.", false),

        new Setting("gdrive.drive-id", "gdrive.drive-id", Type.STRING,
            "Google Drive", "Shared drive ID",
            "Only needed for a shared drive. Leave blank for My Drive or a shared folder.", false),

        new Setting("gdrive.max-files-per-sync", "gdrive.max-files-per-sync", Type.INTEGER,
            "Google Drive", "Max files per sync",
            "Safety limit on how many files a single sync run will index.", false),

        // ── Schedules ───────────────────────────────────────────────────────
        new Setting("scheduler.servicenow.enabled", "scheduler.servicenow.enabled", Type.BOOLEAN,
            "Schedules", "ServiceNow sync enabled",
            "Whether the scheduled ServiceNow sync runs. Takes effect immediately.", false),

        new Setting("scheduler.servicenow.cron", "scheduler.servicenow.cron", Type.STRING,
            "Schedules", "ServiceNow sync schedule",
            "Spring cron expression, six fields. Bound at startup, so a change needs a "
                + "restart.", true),

        new Setting("scheduler.servicenow.sync-limit", "scheduler.servicenow.sync-limit", Type.INTEGER,
            "Schedules", "ServiceNow records per run",
            "Maximum records pulled by one scheduled sync.", false),

        new Setting("scheduler.servicenow.lookback-seconds", "scheduler.servicenow.lookback-seconds",
            Type.INTEGER, "Schedules", "ServiceNow lookback (seconds)",
            "How far back a scheduled run reaches when there is no stored watermark.", false),

        new Setting("scheduler.gdrive.enabled", "scheduler.gdrive.enabled", Type.BOOLEAN,
            "Schedules", "Drive sync enabled",
            "Whether the scheduled Google Drive sync runs. Takes effect immediately.", false),

        new Setting("scheduler.gdrive.cron", "scheduler.gdrive.cron", Type.STRING,
            "Schedules", "Drive sync schedule",
            "Spring cron expression, six fields. Bound at startup, so a change needs a "
                + "restart.", true),

        // ── Analytics ───────────────────────────────────────────────────────
        new Setting("analytics.cost-per-ticket-usd", "analytics.cost-per-ticket-usd", Type.DECIMAL,
            "Analytics", "Cost per ticket (USD)",
            "Loaded cost of an agent handling one ticket. This drives the savings figure "
                + "and should be agreed with the customer rather than left at the default.", false),

        new Setting("analytics.reporting-window-days", "analytics.reporting-window-days", Type.INTEGER,
            "Analytics", "Reporting window (days)",
            "How many days of history the deflection dashboard covers.", false),

        // ── Knowledge ───────────────────────────────────────────────────────
        new Setting("knowledge.synthetic-data.enabled", "knowledge.synthetic-data.enabled",
            Type.BOOLEAN, "Knowledge", "Allow synthetic data loading",
            "Permits the seeder to write fabricated incidents into the connected "
                + "ServiceNow instance. Never enable against an instance holding real "
                + "tickets.", false)
    );

    public static Optional<Setting> find(String key) {
        return ALL.stream().filter(s -> s.key().equals(key)).findFirst();
    }

    public static boolean isKnown(String key) {
        return find(key).isPresent();
    }
}
