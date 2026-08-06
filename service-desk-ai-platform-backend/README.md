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

### Step 1: Copy the environment template

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

### Step 2: Create the database

```bash
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE servicedesk_ai;"
```

> **Note:** Liquibase runs automatically on startup and creates all tables. You don't need to run any SQL manually.

### Step 3: Build and run

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

# Prometheus metrics
curl http://localhost:8081/actuator/prometheus
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
├── pom.xml                          # Parent POM (multi-module)
├── .env.example                     # Environment template
├── .env.local                       # Your local secrets (git-ignored)
├── docker-compose.yml               # Postgres + Redis + Prometheus + Grafana
├── setup.sh / setup.bat             # One-click setup scripts
├── openapi.yaml                     # OpenAPI 3.0 spec
├── postman/                         # Postman collection
├── servicenow-plugin/               # ServiceNow portal widget + scripts
│
├── modules/
│   ├── api/                         # REST controllers + Spring Boot entry point
│   ├── application/                 # Business logic services (suggestion engine, sync, confidence)
│   ├── domain/                      # Entities, models, repository interfaces
│   ├── common/                      # Exceptions, base models, correlation context
│   ├── knowledge-loader/            # Document parsers (Tika), chunking engine
│   ├── integration/
│   │   ├── pinecone/                # Vector DB adapter
│   │   ├── servicenow/              # ServiceNow REST client + OAuth2
│   │   └── llm/                     # Gemini LLM + embedding adapters
│   ├── analytics/                   # Deflection metrics, ROI calculation
│   ├── security/                    # JWT auth, Spring Security config
│   └── infrastructure/              # AOP audit logger, ServiceNow sync scheduler
│
└── infra/                           # Prometheus config
```

---

## Docker Compose (Optional)

If you prefer containers for infrastructure services (Postgres, Redis, Prometheus, Grafana):

```bash
# Set your API keys
export GEMINI_API_KEY=your-key
export AI_PINECONE_API_KEY=your-key
export AI_PINECONE_HOST=your-host

# Start infrastructure
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

**Application won't start -- "Connection refused" to PostgreSQL**
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
