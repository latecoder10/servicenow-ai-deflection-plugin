-- liquibase formatted sql

-- changeset ayan:deflection_telemetry_v1
-- comment: Records every AI suggestion and its outcome so deflection can be reported
--          from data rather than from counters that reset whenever the service restarts.

-- ============================================================
-- deflection_analytics: one row per suggestion produced
-- ============================================================
ALTER TABLE deflection_analytics
    ADD COLUMN IF NOT EXISTS suggestion_id  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS category       VARCHAR(100),
    ADD COLUMN IF NOT EXISTS department     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS sources_count  INT,
    ADD COLUMN IF NOT EXISTS model_used     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS latency_ms     BIGINT,
    ADD COLUMN IF NOT EXISTS caller_email   VARCHAR(150),
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS outcome        VARCHAR(30),
    ADD COLUMN IF NOT EXISTS outcome_at     TIMESTAMPTZ;

-- Reporting is almost always "since a date", and feedback arrives by suggestion id.
CREATE INDEX IF NOT EXISTS idx_deflection_created    ON deflection_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deflection_suggestion ON deflection_analytics (suggestion_id);
CREATE INDEX IF NOT EXISTS idx_deflection_outcome    ON deflection_analytics (outcome) WHERE outcome IS NOT NULL;

-- ============================================================
-- search_history: what people actually asked for
-- ============================================================
ALTER TABLE search_history
    ADD COLUMN IF NOT EXISTS source        VARCHAR(50) DEFAULT 'SEARCH_API',
    ADD COLUMN IF NOT EXISTS latency_ms    BIGINT,
    ADD COLUMN IF NOT EXISTS top_score     DOUBLE PRECISION;

-- Frequency analysis over a recent window drives "what should we write an article about".
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history (created_at DESC);

-- ============================================================
-- user_feedback: the agent's verdict on a suggestion
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_feedback_reference ON user_feedback (reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created   ON user_feedback (created_at DESC);
