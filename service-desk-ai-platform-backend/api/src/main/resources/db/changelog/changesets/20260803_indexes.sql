-- liquibase formatted sql

-- changeset ayan:6
-- comment: Creating performance indexes and GIN indexes for JSONB columns
CREATE INDEX idx_docs_status ON knowledge_documents(status);
CREATE INDEX idx_docs_workspace ON knowledge_documents(workspace_id);
CREATE INDEX idx_docs_department ON knowledge_documents(department_id);
CREATE INDEX idx_chunks_doc ON knowledge_chunks(document_id);
CREATE INDEX idx_chunks_pinecone ON knowledge_chunks(pinecone_vector_id);
CREATE INDEX idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX idx_indexing_jobs_status ON indexing_jobs(job_status);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(performed_by);
CREATE INDEX idx_docs_metadata_gin ON knowledge_documents USING gin (metadata);
CREATE INDEX idx_audit_details_gin ON audit_logs USING gin (details);

-- rollback DROP INDEX idx_audit_details_gin;
-- rollback DROP INDEX idx_docs_metadata_gin;
-- rollback DROP INDEX idx_audit_user;
-- rollback DROP INDEX idx_audit_entity;
-- rollback DROP INDEX idx_indexing_jobs_status;
-- rollback DROP INDEX idx_upload_jobs_status;
-- rollback DROP INDEX idx_chunks_pinecone;
-- rollback DROP INDEX idx_chunks_doc;
-- rollback DROP INDEX idx_docs_department;
-- rollback DROP INDEX idx_docs_workspace;
-- rollback DROP INDEX idx_docs_status;
