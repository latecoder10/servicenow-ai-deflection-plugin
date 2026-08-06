# AI Service Desk Knowledge Intelligence Platform

> **Backend API** that sits between employees and ServiceNow. When someone describes an IT issue (VPN drops, password lockouts, etc.), the platform searches its knowledge base using AI, generates a resolution, and deflects the ticket if confidence is high enough.

---

## What This Does (In Plain English)

```
Employee types issue  -->  AI searches knowledge base  -->  Generates resolution  -->  Deflects ticket (saves ~$15/incident)
```

1. Employee describes their problem in the ServiceNow portal
2. Backend vectorizes the query and searches Pinecone (vector DB) for similar resolved incidents and knowledge articles
3. Gemini LLM generates a step-by-step fix with code/CLI snippets
4. If confidence >= 75%, the issue is resolved without creating a ServiceNow ticket
5. If confidence is low, a real ticket is created and assigned to an agent

---

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| **Java** | 17+ | Runtime (project targets Java 17) |
| **Maven** | 3.9+ | Build tool |
| **PostgreSQL** | 16+ | Database for metadata, audit logs, sync jobs |
| **psql** | (comes with PostgreSQL) | CLI to create the database |

You also need API keys for:
- **Google Gemini** (LLM + embeddings) -- get from [Google AI Studio](https://aistudio.google.com/apikey)
- **Pinecone** (vector search) -- get from [Pinecone Console](https://app.pinecone.io/)
- **ServiceNow** instance (optional, for full functionality)

---

## Quick Setup (3 Steps)

> **Important:** The app runs with the `dev` profile by default (`spring.profiles.active: dev` in `application.yml`). In dev mode, **all authentication is disabled** so you can call endpoints directly without JWT tokens.

> **Note on setup scripts:** `setup.sh` is portable. `setup.bat` has hardcoded paths for Java and PostgreSQL -- edit the `JAVA_HOME` and `psql.exe` paths if yours differ.

### One-Click Setup (Recommended)

```bash
# Windows
setup.bat

# Linux / Mac
./setup.sh
```

The setup script does **everything** -- copies `.env.local`, creates the `servicedesk_ai` database, builds all modules. Then just run:

```bash
mvn spring-boot:run -pl modules/api -DskipTests
```

### Manual Setup (If not using setup script)

#### Step 1: Copy the environment template

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your real values:

```bash
# Required: Your Gemini API key
GEMINI_API_KEY=your-gemini-key-here

# Required: Your Pinecone credentials
AI_PINECONE_API_KEY=your-pinecone-key
AI_PINECONE_HOST=your-index.svc.aped-4627-b74a.pinecone.io

# Database (defaults work if PostgreSQL is local with password "root")
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/servicedesk_ai
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=root

# ServiceNow (optional -- needed for real ticket deflection)
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_CLIENT_ID=your-client-id
SERVICENOW_CLIENT_SECRET=your-client-secret
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password
```

#### Step 2: Create the database (REQUIRED -- app won't start without it)

```bash
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE servicedesk_ai;"
```

> **This is mandatory.** The app connects to `servicedesk_ai` on startup. If the database doesn't exist, you'll get a connection error and the app will crash. Liquibase handles all table creation automatically once the database exists.

#### Step 3: Build and run

```bash
# Build all modules
mvn clean install -DskipTests

# Run the application (dev profile is active by default -- no auth required)
mvn spring-boot:run -pl modules/api -DskipTests
```

That's it. The API starts on `http://localhost:8080`.

---

## Verify It's Working

```bash
# Health check
curl http://localhost:8080/api/v1/health

# Swagger UI (interactive API docs)
# Open in browser: http://localhost:8080/swagger-ui.html

# Actuator endpoints (health, metrics, prometheus) - all on same port
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/prometheus
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key for LLM and embeddings |
| `AI_PINECONE_API_KEY` | Yes | - | Pinecone vector database API key |
| `AI_PINECONE_HOST` | Yes | - | Pinecone index host URL |
| `SPRING_DATASOURCE_URL` | No | `jdbc:postgresql://localhost:5432/servicedesk_ai` | PostgreSQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | No | `postgres` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | No | `changeme` | PostgreSQL password |
| `SERVICENOW_INSTANCE_URL` | No | - | ServiceNow instance URL (e.g. `https://dev12345.service-now.com`) |
| `SERVICENOW_CLIENT_ID` | No | - | ServiceNow OAuth2 client ID |
| `SERVICENOW_CLIENT_SECRET` | No | - | ServiceNow OAuth2 client secret |
| `SERVICENOW_USERNAME` | No | - | ServiceNow admin username |
| `SERVICENOW_PASSWORD` | No | - | ServiceNow admin password |
| `SCHEDULER_SERVICENOW_ENABLED` | No | `true` | Enable/disable auto-sync scheduler |
| `SCHEDULER_SERVICENOW_CRON` | No | `0 0 2 * * ?` | Cron for ServiceNow sync (default: 2 AM daily) |

---

## API Endpoints

All endpoints are under `/api/v1`. The `dev` profile disables authentication, so you can call them directly.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Platform health check |
| `POST` | `/api/v1/suggestions/resolve` | AI resolution for an incident description |
| `POST` | `/api/v1/knowledge/load-synthetic` | Load demo data into ServiceNow |
| `GET` | `/api/v1/knowledge/search?query=...` | Semantic search across knowledge base |
| `GET` | `/api/v1/knowledge/records` | List synchronized knowledge records |
| `POST` | `/api/v1/knowledge/records/{sysId}/reindex` | Re-index a record in Pinecone |

### ServiceNow Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/servicenow/health` | Test ServiceNow connection |
| `POST` | `/api/v1/servicenow/sync/incremental` | Trigger incremental sync |
| `POST` | `/api/v1/servicenow/incidents` | Create a ServiceNow incident |

### File Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/files/upload` | Upload a document for async ingestion |
| `GET` | `/api/v1/files` | List all uploaded documents |
| `GET` | `/api/v1/files/{id}/download` | Download a stored document |

### Analytics & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/deflection` | Deflection rate and ROI metrics |
| `GET` | `/api/v1/analytics/dashboard` | Full executive dashboard |
| `GET` | `/api/v1/pipeline/jobs` | Recent sync job history |

### Example: Generate an AI Resolution

```bash
curl -X POST http://localhost:8080/api/v1/suggestions/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "title": "VPN keeps disconnecting",
    "description": "My VPN connection drops every 10 minutes. I have tried reconnecting but it keeps happening.",
    "callerEmail": "employee@company.com",
    "userDepartment": "IT",
    "category": "Network",
    "minConfidenceThreshold": 0.75
  }'
```

---

## Project Structure

```
service-desk-ai-platform-backend/
│
├── pom.xml                              # Root Maven POM (multi-module parent)
├── .env.example                         # Environment variable template
├── .env.local                           # Your local secrets (git-ignored)
├── .gitignore
├── docker-compose.yml                   # Postgres + Redis + Prometheus + Grafana
├── setup.sh / setup.bat                 # One-click setup scripts
├── openapi.yaml                         # OpenAPI 3.0 spec
├── ARCHITECTURE.md                      # Architecture documentation
├── POC_DOCUMENTATION.md                 # POC documentation
│
├── img/img.png                          # Project image
├── infra/prometheus.yml                 # Prometheus scrape config
├── postman/                             # Postman collection
│   └── AI-Service-Desk-Platform.postman_collection.json
├── scripts/docs/                        # Doc generation utilities
│   └── generate_architecture_doc.py
│
├── servicenow-plugin/                   # ServiceNow portal widget + scripts
│   ├── 01-script-include.js             # Server-side Script Include
│   ├── 02-client-script.js              # Client Script for ticket form
│   ├── 03-rest-message.json             # REST Message config
│   ├── SERVICENOW-SETUP-GUIDE.md        # Step-by-step ServiceNow guide
│   └── widget/                          # Service Portal Widget
│       ├── html-template.html
│       ├── css-styles.css
│       └── client-script.js
│
└── modules/                             # ====== JAVA MODULES ======
    │
    ├── api/                             # [ENTRY POINT] REST controllers + Spring Boot main()
    │   ├── src/main/java/.../api/
    │   │   ├── ServiceDeskAiApplication.java
    │   │   ├── controller/              # 8 REST controllers
    │   │   ├── dto/                     # Request/Response DTOs
    │   │   └── exception/               # Global exception handler
    │   ├── src/main/resources/
    │   │   ├── application.yml           # All config (DB, AI, ServiceNow, scheduler)
    │   │   ├── data/synthetic-incidents.json
    │   │   └── db/changelog/            # Liquibase schema migrations
    │   └── src/test/                    # Tests
    │
    ├── application/                     # Business logic layer
    │   └── src/main/java/.../application/
    │       ├── connector/               # KnowledgeConnectorRegistry, ServiceNowConnector
    │       ├── port/in/                 # Use case interfaces (CQRS commands)
    │       └── service/                 # SuggestionEngine, ConfidenceCalculator, SyncOrchestrator, SyntheticDataLoader
    │
    ├── domain/                          # Domain layer (entities, models, repos)
    │   └── src/main/java/.../domain/
    │       ├── entity/                  # 11 JPA entities (KnowledgeDocument, SyncJob, etc.)
    │       ├── model/                   # Domain models (Incident, ResolutionSuggestion, ConfidenceScore)
    │       ├── event/                   # Domain events
    │       ├── repository/              # 8 JPA repository interfaces
    │       └── util/                    # TextChunker, KnowledgeRecordUtils
    │
    ├── common/                          # Shared exceptions and base models
    │   └── src/main/java/.../common/
    │       ├── exception/               # DomainException, IntegrationException, ResourceNotFoundException
    │       └── model/                   # BaseEntity, AuditableEntity, ProblemDetails, CorrelationContext
    │
    ├── knowledge-loader/                # Document parsing and chunking
    │   └── src/main/java/.../loader/
    │       ├── parser/                  # Tika-based DocumentParserFactory, TextDocumentParser
    │       └── chunking/                # SlidingWindowChunker, ChunkingEngine
    │
    ├── integration/                     # External system adapters
    │   ├── llm/                         # Spring AI Gemini adapter + RerankingEngine
    │   │   └── src/.../llm/
    │   │       ├── config/              # LlmConfig, EmbeddingConfig
    │   │       ├── SpringAiLlmAdapter.java
    │   │       ├── SpringAiEmbeddingAdapter.java
    │   │       └── RerankingEngine.java
    │   ├── pinecone/                    # Pinecone vector DB adapter
    │   │   └── src/.../pinecone/
    │   │       ├── config/PineconeConfig.java
    │   │       ├── PineconeVectorAdapter.java
    │   │       └── PineconeIndexResolver.java
    │   └── servicenow/                  # ServiceNow REST client + OAuth2
    │       └── src/.../servicenow/
    │           ├── client/              # ServiceNowConfig, ServiceNowOAuth2Client
    │           └── ServiceNowRestAdapter.java
    │
    ├── analytics/                       # Deflection metrics and ROI
    │   └── src/.../analytics/
    │       ├── model/DeflectionMetrics.java
    │       └── service/DeflectionAnalyticsService.java
    │
    ├── security/                        # JWT auth and Spring Security
    │   └── src/.../security/
    │       ├── config/                  # SecurityConfig (prod), SecurityDevConfig (dev - no auth)
    │       └── jwt/                     # JwtTokenProvider, JwtAuthenticationFilter
    │
    └── infrastructure/                  # Scheduling and AOP
        └── src/.../infrastructure/
            ├── scheduler/               # ServiceNowSyncScheduler (cron-based)
            └── aspect/                  # AuditLogAspect
```

---

## Docker Compose (Optional)

The `docker-compose.yml` can spin up infrastructure services (Postgres, Redis, Prometheus, Grafana). There is no Dockerfile in the project -- the Java app runs locally.

```bash
# Start infrastructure only (Postgres, Redis, Prometheus, Grafana)
docker-compose up -d postgres redis prometheus grafana

# Then run the Java app locally (it connects to the containerized Postgres)
mvn spring-boot:run -pl modules/api -DskipTests
```

Services:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Prometheus**: `localhost:9090`
- **Grafana**: `localhost:3001` (password: `admin`)

---

## Running Tests

```bash
# Unit tests
mvn test

# Integration tests (requires Docker for Testcontainers)
mvn verify -P integration-test
```

---

## ServiceNow Plugin (Optional)

The `servicenow-plugin/` directory contains everything needed to deploy the AI widget into your ServiceNow instance:

- `01-script-include.js` -- Server-side Script Include
- `02-client-script.js` -- Client Script for the ticket form
- `03-rest-message.json` -- REST Message configuration
- `widget/` -- Service Portal Widget (HTML/SCSS/Server Script/Client Script)
- `SERVICENOW-SETUP-GUIDE.md` -- Step-by-step ServiceNow deployment guide

---

## Troubleshooting

**Application won't start -- "Connection refused" or "database does not exist"**
- The `servicedesk_ai` database must exist BEFORE you start the app
- Create it: `psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE servicedesk_ai;"`
- Make sure PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check your password in `.env.local` matches your PostgreSQL password

**"GEMINI_API_KEY is blank" warning**
- Fill in `GEMINI_API_KEY` in your `.env.local` file

**Pinecone connection errors**
- Verify `AI_PINECONE_HOST` matches your index's host (from Pinecone Console)
- Make sure the index dimension is set to `1024` (matches `gemini-embedding-001`)

**Port 8080 already in use**
- Change the port: add `SERVER_PORT=8081` to `.env.local`

**ServiceNow 401 Unauthorized**
- Verify `SERVICENOW_CLIENT_ID` and `SERVICENOW_CLIENT_SECRET` are correct
- Make sure the OAuth2 application is active in ServiceNow
