# Enterprise AI Knowledge Synchronization Platform — Technical POC Documentation

> **Enterprise ServiceNow Knowledge Synchronization & AI Incident Deflection Engine**  
> **Version:** 2.5.0-SNAPSHOT  
> **Prepared By:** AI & ITSM Platform Engineering Team  
> **Tech Stack:** Java 21, Spring Boot 3.4+, Spring AI 1.0.0-M6, Pinecone Vector DB, Google Gemini 3.6 Flash, ServiceNow REST API v2, PostgreSQL, Liquibase, Resilience4j, Prometheus & Grafana  

---

## 📋 Executive Summary & Architecture Overview

The **Enterprise AI Knowledge Synchronization Platform** continuously synchronizes resolved ServiceNow incidents, knowledge articles, and attachment metadata into a unified Pinecone AI semantic knowledge index (`servicedesk-knowledge`).

### Core Guiding Principles:
1. **ServiceNow is the System of Record**: ServiceNow owns all Incidents, Knowledge Articles, Attachment binary files (PDFs, Word docs, images), Comments, Work Notes, and Audit Trails.
2. **AI Knowledge Layer**: Our platform acts as the intelligent semantic synchronization and deflection layer. We **never** duplicate binary attachment files or full ServiceNow records.
3. **Pinecone Semantic Index**: Pinecone stores vector embeddings, chunk text, and metadata tags (e.g. `workspace`, `category`, `department`, `priority`, `year`, `documentType`, `attachmentCount`).
4. **PostgreSQL Operational Store**: Stores connector configurations, OAuth tokens, sync job status, sync execution history, search metrics, feedback, and audit logs.
5. **Connector-Based Architecture**: Extensible `KnowledgeConnector` interface supporting `ServiceNowKnowledgeConnector` now, with support for Jira, Confluence, and SharePoint connectors in the future.

---

## 🏛️ Connector & Synchronization Architecture

```
                                +-----------------------------------+
                                |            API LAYER              |
                                | (ConnectorController, ServiceNow) |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------+-----------------+
                                |        APPLICATION LAYER          |
                                |  (AsyncKnowledgeSyncService)      |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------+-----------------+
                                |        CONNECTOR REGISTRY         |
                                |   (KnowledgeConnector Interface)  |
                                +--+--------------+--------------+--+
                                   |              |              |
           +-----------------------+              |              +-----------------------+
           |                                      |                                      |
           v                                      v                                      v
+----------+----------+                +----------+----------+                +----------+----------+
|  ServiceNowConnector|                |    JiraConnector    |                | ConfluenceConnector |
|  (Resolved Incidents|                |  (Future Connector) |                |  (Future Connector) |
|   & KB Articles)    |                |                     |                |                     |
+---------------------+                +---------------------+                +---------------------+
```

---

## 📥 Incremental Synchronization Flow

1. **Last Sync Query**: Queries last successful sync timestamp from PostgreSQL `sync_jobs`.
2. **ServiceNow Fetch**: Calls ServiceNow REST API for resolved incidents (`state=6^sys_updated_on>=...`) and published knowledge articles (`workflow_state=published^sys_updated_on>=...`).
3. **Extraction**: Extracts Short Description, Description, Resolution Notes, Work Notes, Comments, Category, Priority, Assignment Group, Configuration Item, and Related Services.
4. **Attachment Metadata Extraction**: Fetches metadata references (sys_id, filename, mimeType, fileSize) via `/api/now/table/sys_attachment`. Stores metadata reference only.
5. **Vector Embedding & Indexing**: Generates 768-dim embeddings via Spring AI / Gemini and upserts into Pinecone index `servicedesk-knowledge` with metadata filter tags.
6. **Sync History & Metrics**: Updates PostgreSQL sync job status, counts (created, updated, skipped, failed), execution duration, and audit logs.

---

## 🌐 Key REST Endpoints

- `GET /api/v1/connectors`: List all available knowledge connector types
- `POST /api/v1/connectors/{type}/test`: Test connection health
- `POST /api/v1/connectors/{type}/sync`: Trigger background sync job
- `POST /api/v1/servicenow/sync/incremental`: Trigger incremental ServiceNow sync
- `GET /api/v1/servicenow/attachments/metadata/{attachmentId}`: Fetch attachment metadata reference
- `GET /api/v1/servicenow/attachments/download/{attachmentId}`: Proxy attachment binary download from ServiceNow
- `GET /api/v1/knowledge/search`: Semantic search across synchronized Pinecone index
- `POST /api/v1/suggestions/resolve`: Real-time AI ticket deflection suggestions
- `GET /api/v1/analytics/dashboard`: Complete Executive Synchronization & AI Knowledge Layer Metrics Dashboard
