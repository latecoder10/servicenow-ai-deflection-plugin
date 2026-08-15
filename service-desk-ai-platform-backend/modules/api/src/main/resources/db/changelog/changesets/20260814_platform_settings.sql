-- liquibase formatted sql

-- changeset ayan:platform_settings
-- comment: Runtime-editable configuration, so operational settings such as the Drive
--          folder id or the sync schedule can be changed by an admin instead of by
--          editing .env and redeploying.
--
--          This table holds OVERRIDES ONLY. The catalogue of what is configurable -
--          the label, type, category and default - lives in code (SettingsCatalog), so
--          the set of known settings is versioned with the application and the two
--          cannot drift. A key with no row here simply falls back to its Spring
--          property, which means an empty table changes nothing.
--
--          Secrets deliberately do NOT belong here: API keys, the ServiceNow client
--          secret and the datasource credentials stay in the environment. A secret in
--          a table is plaintext at rest and leaks into every backup and dump, and the
--          datasource credentials in particular cannot live in the database they are
--          needed to reach.

CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(150) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_platform_settings_key ON platform_settings (setting_key);
