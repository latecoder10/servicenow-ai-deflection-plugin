-- liquibase formatted sql

-- changeset ayan:full_schema_v1
-- comment: Full consolidated schema - all tables, indexes, extensions for fresh DB creation

-- ============================================================
-- EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES (ordered by dependency)
-- ============================================================

-- 1. users (no FK dependencies)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. workspaces (no FK dependencies)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. departments (FK: workspaces)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. knowledge_categories (no FK dependencies)
CREATE TABLE knowledge_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. knowledge_documents (FK: workspaces, departments, knowledge_categories)
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID,
    department_id UUID,
    category_id UUID,
    source_id UUID,
    title VARCHAR(500) NOT NULL,
    source_type VARCHAR(50),
    storage_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    checksum VARCHAR(64),
    quality_score INT DEFAULT 100,
    status VARCHAR(50) DEFAULT 'PROCESSING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6. knowledge_chunks (FK: knowledge_documents)
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,
    version_id UUID,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. upload_jobs (FK: knowledge_documents)
CREATE TABLE upload_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID,
    filename VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PROCESSING',
    progress_percentage INT DEFAULT 0,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 8. indexing_jobs (FK: knowledge_documents)
CREATE TABLE indexing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID,
    status VARCHAR(50) DEFAULT 'PENDING',
    chunks_processed INT DEFAULT 0,
    total_chunks INT DEFAULT 0,
    progress_percentage INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9. ai_configurations (no FK dependencies)
CREATE TABLE ai_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. prompt_templates (no FK dependencies)
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL UNIQUE,
    prompt_text TEXT NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. search_history (no FK dependencies)
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    department VARCHAR(100),
    category VARCHAR(100),
    top_k INT DEFAULT 5,
    results_returned INT DEFAULT 0,
    created_by VARCHAR(50) DEFAULT 'anonymous',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. servicenow_configurations (no FK dependencies)
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

-- 13. servicenow_sync_logs (no FK dependencies)
CREATE TABLE servicenow_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL,
    items_synced INT DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMPTZ
);

-- 14. audit_logs (no FK dependencies)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    principal VARCHAR(150),
    action VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    ip_address VARCHAR(45),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 15. user_feedback (no FK dependencies)
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id VARCHAR(100) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_by VARCHAR(50) DEFAULT 'anonymous',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. deflection_analytics (no FK dependencies)
CREATE TABLE deflection_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_sys_id VARCHAR(100),
    query_text TEXT,
    deflected BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score DOUBLE PRECISION,
    resolution_suggested TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. connector_configurations (no FK dependencies)
CREATE TABLE connector_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_type VARCHAR(50) NOT NULL UNIQUE,
    instance_url VARCHAR(255) NOT NULL,
    client_id VARCHAR(255),
    client_secret_encrypted VARCHAR(500),
    username VARCHAR(100),
    workspace VARCHAR(100),
    settings_json TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 18. sync_jobs (no FK dependencies)
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(100) NOT NULL UNIQUE,
    connector_type VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    items_fetched INT DEFAULT 0,
    items_created INT DEFAULT 0,
    items_updated INT DEFAULT 0,
    items_deleted INT DEFAULT 0,
    items_skipped INT DEFAULT 0,
    items_failed INT DEFAULT 0,
    execution_time_ms BIGINT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 19. attachment_metadata (no FK dependencies)
CREATE TABLE attachment_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_id VARCHAR(100) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    table_name VARCHAR(100) NOT NULL,
    record_sys_id VARCHAR(100) NOT NULL,
    download_url VARCHAR(500),
    connector_type VARCHAR(50) DEFAULT 'SERVICENOW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(150),
    updated_by VARCHAR(150),
    soft_delete BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Audit log indexes
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_principal ON audit_logs(principal);
CREATE INDEX idx_audit_details_gin ON audit_logs USING gin (details);

-- Knowledge document indexes
CREATE INDEX idx_docs_status ON knowledge_documents(status);
CREATE INDEX idx_docs_workspace ON knowledge_documents(workspace_id);
CREATE INDEX idx_docs_department ON knowledge_documents(department_id);

-- Knowledge chunk indexes
CREATE INDEX idx_chunks_doc ON knowledge_chunks(document_id);

-- Job indexes
CREATE INDEX idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX idx_indexing_jobs_status ON indexing_jobs(status);

-- ============================================================
-- FOREIGN KEYS (added after all tables exist)
-- ============================================================
ALTER TABLE knowledge_documents ADD CONSTRAINT fk_docs_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id);
ALTER TABLE knowledge_documents ADD CONSTRAINT fk_docs_department FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE knowledge_documents ADD CONSTRAINT fk_docs_category FOREIGN KEY (category_id) REFERENCES knowledge_categories(id);

ALTER TABLE knowledge_chunks ADD CONSTRAINT fk_chunks_document FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE;

ALTER TABLE upload_jobs ADD CONSTRAINT fk_upload_document FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE SET NULL;

ALTER TABLE indexing_jobs ADD CONSTRAINT fk_indexing_document FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE;
