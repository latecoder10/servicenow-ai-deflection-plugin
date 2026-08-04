-- Add missing columns to upload_jobs table

ALTER TABLE upload_jobs ADD COLUMN retry_count INT DEFAULT 0;
ALTER TABLE upload_jobs ADD COLUMN updated_by VARCHAR(150) DEFAULT 'system';
ALTER TABLE upload_jobs ADD COLUMN soft_delete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE upload_jobs ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- rollback ALTER TABLE upload_jobs DROP COLUMN retry_count;
-- rollback ALTER TABLE upload_jobs DROP COLUMN updated_by;
-- rollback ALTER TABLE upload_jobs DROP COLUMN soft_delete;
-- rollback ALTER TABLE upload_jobs DROP COLUMN version;
