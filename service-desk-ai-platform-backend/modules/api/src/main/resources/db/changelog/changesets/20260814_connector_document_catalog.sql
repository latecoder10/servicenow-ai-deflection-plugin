-- liquibase formatted sql

-- changeset ayan:connector_document_catalog
-- comment: Let connector-synced records live in knowledge_documents beside uploaded files.
--          Until now only the file-upload path wrote a row, so everything synced from
--          ServiceNow or Drive existed solely as vectors in Pinecone: no audit of what
--          was indexed, and no way to rebuild the index without re-fetching every record
--          from the source system.

-- Synced records have no file behind them. The column was NOT NULL because uploads were
-- the only writer.
ALTER TABLE knowledge_documents ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE knowledge_documents
    ADD COLUMN connector_type VARCHAR(50),
    ADD COLUMN external_id VARCHAR(100),
    ADD COLUMN external_number VARCHAR(100),
    ADD COLUMN vector_document_id VARCHAR(200),
    ADD COLUMN source_uri VARCHAR(1000),
    ADD COLUMN department_name VARCHAR(150),
    ADD COLUMN category_name VARCHAR(150),
    ADD COLUMN owner_email VARCHAR(150),
    ADD COLUMN chunk_count INT DEFAULT 0,
    ADD COLUMN last_indexed_at TIMESTAMPTZ;

-- The identity of a source record, and the key the sync upserts on. Partial, because
-- rows written by the upload path before this changeset carry neither column.
CREATE UNIQUE INDEX uq_docs_connector_external
    ON knowledge_documents (connector_type, external_id)
    WHERE connector_type IS NOT NULL AND external_id IS NOT NULL;

-- The join between a Postgres row and its vectors.
CREATE INDEX idx_docs_vector_document ON knowledge_documents (vector_document_id);
CREATE INDEX idx_docs_connector ON knowledge_documents (connector_type);

-- The same join at chunk granularity, so a retrieved vector can be traced to the exact
-- stored chunk it was embedded from.
ALTER TABLE knowledge_chunks ADD COLUMN vector_chunk_id VARCHAR(200);

CREATE INDEX idx_chunks_vector ON knowledge_chunks (vector_chunk_id);

-- department_name and category_name are denormalised on purpose: departments and
-- knowledge_categories are never populated by any code path, so the existing
-- department_id and category_id foreign keys have nothing to point at.
