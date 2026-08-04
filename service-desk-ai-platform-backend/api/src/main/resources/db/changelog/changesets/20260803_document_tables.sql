-- liquibase formatted sql

-- changeset ayan:2
-- comment: Creating knowledge documents, chunks, upload jobs, and indexing jobs with Postgres UUID and JSONB
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    checksum VARCHAR(64),
    quality_score INT DEFAULT 100,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    workspace_id UUID REFERENCES workspaces(id),
    department_id UUID REFERENCES departments(id),
    category_id UUID REFERENCES knowledge_categories(id),
    metadata JSONB,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INT NOT NULL,
    pinecone_vector_id VARCHAR(100),
    created_by VARCHAR(50) NOT NULL DEFAULT 'system_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE upload_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    progress_percentage INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMPTZ,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE indexing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    job_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    chunks_created INT DEFAULT 0,
    embeddings_generated INT DEFAULT 0,
    pinecone_upserted INT DEFAULT 0,
    retry_count INT DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- rollback DROP TABLE indexing_jobs;
-- rollback DROP TABLE upload_jobs;
-- rollback DROP TABLE knowledge_chunks;
-- rollback DROP TABLE knowledge_documents;
