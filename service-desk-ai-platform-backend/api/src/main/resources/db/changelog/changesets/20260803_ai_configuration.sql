-- liquibase formatted sql

-- changeset ayan:3
-- comment: Creating ai configurations, prompt templates, and search history tables
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

-- rollback DROP TABLE search_history;
-- rollback DROP TABLE prompt_templates;
-- rollback DROP TABLE ai_configurations;
