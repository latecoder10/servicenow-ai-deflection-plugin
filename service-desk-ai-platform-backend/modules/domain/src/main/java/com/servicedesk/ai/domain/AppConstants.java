package com.servicedesk.ai.domain;

public final class AppConstants {

    private AppConstants() {}

    // ── Vector IDs ────────────────────────────────────────────────────────
    public static final String VECTOR_ID_PREFIX = "sn-";
    public static final String VECTOR_ID_SEPARATOR = "-";

    // ── Collection / Index Names ──────────────────────────────────────────
    public static final String COLLECTION_SERVICENOW = "servicenow";
    public static final String COLLECTION_KNOWLEDGE_ARTICLES = "Knowledge_Articles";
    public static final String COLLECTION_SERVICESK_DESK_KNOWLEDGE = "servicedesk-knowledge";
    public static final String COLLECTION_RESOLVED_INCIDENTS = "Resolved_Incidents";

    // ── Embedding ─────────────────────────────────────────────────────────
    public static final String EMBEDDING_MODEL = "gemini-embedding-001";
    public static final int EMBEDDING_DIMENSION = 1024;
    public static final int EMBEDDING_BATCH_SIZE = 100;
    public static final int EMBEDDING_MAX_TEXT_LENGTH = 20000;

    // ── Pinecone ──────────────────────────────────────────────────────────
    public static final int PINECONE_BATCH_SIZE = 96;
    public static final int PINECONE_MAX_RETRIES = 3;
    public static final long PINECONE_INITIAL_BACKOFF_MS = 1000;
    public static final String PINECONE_API_KEY_HEADER = "Api-Key";
    public static final String PINECONE_UPSERT_PATH = "/vectors/upsert";
    public static final String PINECONE_QUERY_PATH = "/query";
    public static final String PINECONE_DELETE_PATH = "/vectors/delete";

    // ── Text Chunking ─────────────────────────────────────────────────────
    public static final int CHUNK_SIZE_CHARS = 1500;
    public static final int CHUNK_OVERLAP_CHARS = 200;

    // ── Sync Defaults ─────────────────────────────────────────────────────
    public static final int DEFAULT_BATCH_LIMIT = 100;

    // ── Default Metadata ──────────────────────────────────────────────────
    public static final String DEFAULT_WORKSPACE = "Enterprise IT";
    public static final String DEFAULT_CATEGORY = "General";
    public static final String DEFAULT_DEPARTMENT = "Global Service Desk";
    public static final String DEFAULT_PRIORITY = "3 - Moderate";

    // ── Connector Types ───────────────────────────────────────────────────
    public static final String CONNECTOR_SERVICENOW = "SERVICENOW";

    // ── Record Types ──────────────────────────────────────────────────────
    public static final String RECORD_TYPE_INCIDENT = "INCIDENT";
    public static final String RECORD_TYPE_KNOWLEDGE_ARTICLE = "KNOWLEDGE_ARTICLE";

    // ── Job Statuses ──────────────────────────────────────────────────────
    public static final String STATUS_RUNNING = "RUNNING";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_COMPLETED_WITH_ERRORS = "COMPLETED_WITH_ERRORS";
    public static final String STATUS_FAILED = "FAILED";

    // ── API ───────────────────────────────────────────────────────────────
    public static final String API_BASE_PATH = "/api/v1";

    // ── Pinecone Metadata Keys ────────────────────────────────────────────
    public static final String META_TEXT = "text";
    public static final String META_DOCUMENT_ID = "documentId";
    public static final String META_CHUNK_INDEX = "chunkIndex";
    public static final String META_TITLE = "title";
    public static final String META_DEPARTMENT = "department";
    public static final String META_CATEGORY = "category";
    public static final String META_RECORD_NUMBER = "recordNumber";
    public static final String META_RECORD_SYS_ID = "recordSysId";
    public static final String META_RECORD_TYPE = "recordType";
    public static final String META_WORKSPACE = "workspace";
    public static final String META_PRIORITY = "priority";
    public static final String META_CONNECTOR_TYPE = "connectorType";
    public static final String META_YEAR = "year";
    public static final String META_ATTACHMENT_COUNT = "attachmentCount";
}
