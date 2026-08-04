# AI Service Desk Knowledge Intelligence Platform

> **Enterprise Pre-Incident AI Deflection Engine & ServiceNow Knowledge Platform**
> Built with Java 21, Spring Boot 3.5+, Spring AI, Pinecone Vector Database, Google Gemini 3.6 Flash, and Clean Hexagonal Architecture.

---

## Quick Start (Local Development)

### One-Click Setup

```bash
# Step 1: Setup (creates DB, builds project)
./setup.sh          # Git Bash / Linux / Mac
setup.bat           # Windows CMD

# Step 2: Run (Liquibase auto-runs on startup)
mvn spring-boot:run -pl api -DskipTests
```

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Java | 21+ | Runtime & Compilation |
| Maven | 3.9+ | Build & Dependency Management |
| PostgreSQL | 16+ | Relational Database |
| psql | (bundled with PostgreSQL) | Database CLI |

### Manual Steps (if not using setup script)

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Create database (Liquibase handles schema automatically)
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE servicedesk_ai;"

# 3. Build & Run
mvn clean install -DskipTests
mvn spring-boot:run -pl api -DskipTests

# 4. Verify
curl http://localhost:8080/api/v1/health
```

---

## 🏛️ Executive Summary

The **AI Service Desk Knowledge Intelligence Platform** sits directly between employee self-service portals and ServiceNow. When an employee starts typing an IT issue (e.g., VPN drops, password lockouts, OWA errors), the platform executes a real-time Retrieval-Augmented Generation (RAG) pipeline:

1. **Embedding Generation**: Vectorizes the user query via Spring AI.
2. **Pinecone Vector Search**: Performs similarity search across Knowledge Articles, Resolved Incidents, and Runbooks.
3. **Cross-Encoder Reranking**: Re-ranks the top candidate chunks for maximum precision.
4. **Gemini LLM Synthesis**: Formulates a verified step-by-step resolution with code/CLI snippets.
5. **Confidence Evaluation**: Calculates a multi-factor score. If confidence exceeds the threshold (e.g. 75%), the issue is resolved immediately **without creating a ticket**, saving an average of $15.50 per deflected incident.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technology |
|---|---|
| **Language & JDK** | Java 21 LTS |
| **Framework** | Spring Boot 3.4.2 / 3.5.0, Spring AI 1.0.0-M6 |
| **Architecture** | Hexagonal Architecture, Clean Architecture, DDD, CQRS |
| **Vector DB** | Pinecone Vector Database (768-dim Text-Embedding-004) |
| **LLM Provider** | Google AI / Gemini 3.6 Flash |
| **Integration** | ServiceNow REST API v2, OAuth2, Resilience4j Circuit Breaker |
| **Document Loader** | Apache Tika (PDF, Word, Excel, CSV, Markdown, ZIP) |
| **Security** | Spring Security, JJWT (JWT Bearer Tokens), Rate Limiting |
| **Observability** | Spring Boot Actuator, Micrometer, Prometheus, Grafana |
| **Testing** | JUnit 5, Mockito, Testcontainers, Spring Boot Test |

---

## 📁 Repository & Multi-Module Structure

```
service-desk-ai-platform/
├── pom.xml                     # Maven Parent POM
├── common/                     # Common exceptions, ProblemDetails RFC 7807, CorrelationContext
├── domain/                     # Entities (Incident, KnowledgeChunk), Value Objects, Domain Events, Ports
├── application/                # Application Services, CQRS Use Cases, Confidence Calculator
├── knowledge-loader/           # Apache Tika Parsers, SlidingWindowChunker, Chunking Engine
├── integration/
│   ├── pinecone/              # Pinecone Vector Adapter & Upsert/Search
│   ├── servicenow/            # ServiceNow REST Client, OAuth2, Circuit Breaker
│   └── llm/                   # Spring AI Gemini Adapter, Embedding Service, Reranker
├── analytics/                  # Deflection metrics, ROI calculation, Micrometer metrics
├── security/                   # Spring Security, JWT Filter, Token Provider
├── infrastructure/             # AOP Audit Logger, Scheduled ServiceNow Sync, Resilience4j
└── api/                        # REST Controllers, DTOs, OpenAPI 3.0 Specs, Application Entry Point
```

---

## 🚀 Enterprise Deployment Guide

### Option 1: Docker Compose (Local / Dev Environment)

```bash
# Clone repository
git clone https://github.com/enterprise/service-desk-ai-platform.git
cd service-desk-ai-platform

# Export environment credentials
export GEMINI_API_KEY="your-gemini-api-key"
export PINECONE_API_KEY="your-pinecone-api-key"
export SERVICENOW_INSTANCE_URL="https://your-instance.service-now.com"

# Launch multi-container stack (App + Postgres + Redis + Prometheus + Grafana)
docker-compose up -d --build

# Verify container health
docker-compose ps
```

### Option 2: Production Build & Deployment

```bash
# Compile and package multi-module project with Java 21
mvn clean package -DskipTests

# Run JAR directly
java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -jar api/target/api-2.5.0-SNAPSHOT.jar
```

---

## 🧪 Testing Strategy

Run unit and integration tests using Maven:

```bash
# Run all unit tests with Mockito & JUnit 5
mvn test

# Run integration tests with Testcontainers
mvn verify -P integration-test
```

---

## 📊 Endpoints & Verification

- **Interactive Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Prometheus Metrics**: `http://localhost:8081/actuator/prometheus`
- **Health Endpoint**: `http://localhost:8080/api/v1/health`

```json
{
  "status": "healthy",
  "timestamp": "2026-08-02T23:09:40Z",
  "service": "AI Service Desk Knowledge Intelligence Platform",
  "version": "2.5.0-SNAPSHOT",
  "pineconeStatus": "connected",
  "servicenowStatus": "synced"
}
```
