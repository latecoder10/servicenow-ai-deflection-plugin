# Rebuilding the Index and Database

Clears Pinecone and Postgres, then reloads everything with complete metadata.

Do it in this order. Phase 3 depends on the backend running against an empty database.

---

## Before you start

Confirm the code is current — the metadata fixes below only apply to data written
*after* they were built:

```powershell
cd service-desk-ai-platform-backend
mvn clean install
```

All tests must pass. A rebuild against stale jars reproduces the problems it is
meant to clear.

---

## Phase 1 — Empty Pinecone

Every namespace must go, not just the current one. Vectors are written to a
namespace derived from each document's own date, so a partial wipe leaves
orphans that still surface in search.

```powershell
cd service-desk-ai-platform-backend
python scripts/reset_pinecone.py --list          # see what is there
python scripts/reset_pinecone.py --delete-all    # asks for confirmation
```

Expect `total: 0` afterwards.

---

## Phase 2 — Empty Postgres

```powershell
# stop the backend first, or Liquibase will fight you for the lock
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS servicedesk_ai;"
psql -h localhost -U postgres -c "CREATE DATABASE servicedesk_ai;"
```

Liquibase recreates the schema on next start. Nothing needs to be run by hand.

---

## Phase 3 — Start the backend

```powershell
mvn spring-boot:run -pl modules/api
```

Watch for:

```
liquibase.util : Run: 1
Registered connector type: GOOGLE_DRIVE
Registered connector type: SERVICENOW
Started ServiceDeskAiApplication
```

`Run: 1` means the schema was created. If it says `Previously run: 1` the old
database is still there and Phase 2 did not take.

---

## Phase 4 — Reload the knowledge

Order does not matter; both write into the same index.

### ServiceNow

```bash
curl -X POST http://localhost:8080/api/v1/connectors/SERVICENOW/sync \
  -H "Content-Type: application/json" \
  -d '{"syncType":"FULL","workspace":"Enterprise IT","batchLimit":500}'
```

### Google Drive

```bash
curl -X POST http://localhost:8080/api/v1/connectors/GOOGLE_DRIVE/sync \
  -H "Content-Type: application/json" \
  -d '{"syncType":"FULL","workspace":"Enterprise IT","batchLimit":500}'
```

---

## Phase 5 — Verify

### Every vector carries its source

```powershell
python scripts/reset_pinecone.py --audit
```

This reports how many vectors carry `connectorType`, `recordNumber` and
`recordSysId`. After a clean rebuild it should be **100% for all three**. Anything
less means a write path is still dropping metadata.

### Search reaches every namespace

```bash
curl "http://localhost:8080/api/v1/knowledge/search?query=VPN%20not%20connecting&topK=5"
```

The log should name every populated namespace, not just the current one:

```
Query responded in 812ms: 5 results across 4 namespace(s) [2010-2014, 2015-2019, 2020-2024, 2025-2029]
```

### Citations resolve to the right system

```bash
curl -X POST http://localhost:8080/api/v1/suggestions/resolve \
  -H "Content-Type: application/json" \
  -d '{"title":"VPN will not connect from home","description":"Client fails to start","callerEmail":"a@b.com","userDepartment":"IT","category":"Network","minConfidenceThreshold":60}'
```

In `sources`, check that:

- ServiceNow entries link to `…service-now.com/incident.do?sys_id=…`
- Drive entries link to `docs.google.com` or `drive.google.com`
- No Drive entry carries a `service-now.com` URL

---

## What this rebuild fixes

Three defects meant older data was written but never retrievable, and the source
of an answer could not always be identified.

**Half the index was unreachable.** Writes chose a namespace from the document's
date; reads only ever queried the current five-year window. In the previous index
that hid 67 of 130 vectors. Search now queries every populated namespace and
merges the results.

**Bulk sync dropped the source system.** `buildMetadata` produced `connectorType`,
but the sync orchestrator copied an allowlist of five keys that omitted it. Only
records reindexed one at a time carried it. It now copies everything except the
fields already promoted to first-class metadata, so a new key cannot be silently
lost the same way.

**Drive citations pointed at ServiceNow.** The link builder assumed every source
lived in the instance, so a Drive document was given a fabricated
`incident.do?sys_id=<drive-file-id>` URL that 404s. Sources that carry their own
address now use it, and anything unresolvable gets no link rather than a broken one.

---

## Notes

`collectionName` is accepted by the vector port but has no effect — the namespace
comes from the document date. Callers pass four different values
(`servicenow`, `Knowledge_Articles`, `servicedesk-knowledge`) and all land in the
same place. Harmless today, but do not rely on it to separate content.

ServiceNow links are assembled at query time from `servicenow.instance-url` rather
than stored. When the instance changes, one property update fixes every existing
citation. Drive links are stored, because a Google `webViewLink` cannot be
reconstructed from configuration.
