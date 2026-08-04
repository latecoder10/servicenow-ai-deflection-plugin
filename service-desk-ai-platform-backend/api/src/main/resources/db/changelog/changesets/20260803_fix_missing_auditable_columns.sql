--liquibase formatted sql

--changeset ai:2026080303-fix-auditable-columns

ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS soft_delete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS soft_delete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

ALTER TABLE indexing_jobs ADD COLUMN IF NOT EXISTS soft_delete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE indexing_jobs ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS version_id UUID;
