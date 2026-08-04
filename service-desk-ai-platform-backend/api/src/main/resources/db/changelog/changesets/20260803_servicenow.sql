-- liquibase formatted sql

-- changeset ayan:4
-- comment: Creating servicenow configurations and sync history tables
CREATE TABLE servicenow_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_url VARCHAR(255) NOT NULL,
    client_id VARCHAR(255),
    client_secret_encrypted VARCHAR(500),
    username VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicenow_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL,
    items_synced INT DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMPTZ
);

-- rollback DROP TABLE servicenow_sync_logs;
-- rollback DROP TABLE servicenow_configurations;
