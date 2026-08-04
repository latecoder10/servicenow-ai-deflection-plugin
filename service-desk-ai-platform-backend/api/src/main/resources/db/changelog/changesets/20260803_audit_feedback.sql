-- liquibase formatted sql

-- changeset ayan:5
-- comment: Creating audit logs, feedback, and deflection analytics tables
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    performed_by VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id VARCHAR(100) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_by VARCHAR(50) DEFAULT 'anonymous',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deflection_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_sys_id VARCHAR(100),
    query_text TEXT,
    deflected BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score DOUBLE PRECISION,
    resolution_suggested TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- rollback DROP TABLE deflection_analytics;
-- rollback DROP TABLE user_feedback;
-- rollback DROP TABLE audit_logs;
