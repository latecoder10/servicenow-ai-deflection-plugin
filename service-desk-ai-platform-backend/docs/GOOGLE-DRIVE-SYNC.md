# Google Drive Knowledge Sync

Indexes documents from a Google Drive folder into Pinecone so they answer questions in the ServiceNow deflection panel alongside resolved incidents.

Incremental by `modifiedTime`: each run asks Drive only for files changed since the last successful sync.

---

## The document convention

**Short answer: no format is required.** A file dropped in the folder is indexed with the file name as its title and the containing folder as its category. Teams will not retrofit hundreds of existing documents before seeing value, so the connector has to work without that.

To control how a document is indexed, open it with a metadata block terminated by a line of three or more dashes:

```
Title: VPN Troubleshooting Runbook
Category: Network
Department: IT Operations
Priority: 2
Owner: it-ops@estuate.com
Tags: vpn, globalprotect, remote access
---

Symptoms
The GlobalProtect client disconnects roughly every 30 minutes...
```

Everything after the dashes is the body that gets embedded.

| Key | Effect | Default without it |
|---|---|---|
| `Title` | Cited in the panel; prepended to the embedded text | File name without extension |
| `Category` | Filters retrieval and is matched against the ticket's Category | Containing folder name |
| `Department` | Filters retrieval | `Global Service Desk` |
| `Priority` | `1`–`5`, boosts ranking. `1` is treated as critical | No boost |
| `Owner` | Recorded for provenance | — |
| `Tags` | Added to the embedded text so synonyms match | — |
| `Effective` | Recorded for provenance | — |

Rules that matter:

- Keys are **case-insensitive**; `title:` and `Title:` behave identically
- **Unknown keys are preserved**, so a team can add `Service:` or `Region:` without a code change
- If any line above the separator is not `Key: Value`, the block is treated as ordinary content and the whole file is indexed — a document that happens to start with a dashed line is never truncated
- Only the first 40 lines are scanned for a separator

### Why `Category` is the one worth filling in

Retrieval filters on category, and the deflection panel sends the Incident form's Category with every request. A document tagged `Category: Network` competes for network tickets rather than against the whole corpus. If the filter matches nothing the query is retried unfiltered, so a wrong category degrades results rather than breaking them — but a right one measurably sharpens them.

### Supported file types

Google Docs (exported as .docx), `.docx`, `.doc`, `.pdf`, and plain text. Anything else in the folder is skipped and logged. Text extraction is Apache Tika, already used for the upload path.

---

## Setup

### 1. Create a service account

1. [Google Cloud Console](https://console.cloud.google.com) → select or create a project
2. **APIs & Services → Library** → enable **Google Drive API**
3. **APIs & Services → Credentials → Create credentials → Service account**
4. Name it e.g. `servicedesk-ai-drive-reader`, no roles needed
5. Open the account → **Keys → Add key → Create new key → JSON**
6. Save the downloaded file somewhere the backend can read, e.g. `./secrets/gdrive-key.json`

The file contains a private key. Keep it out of git — `.gitignore` already excludes `secrets/`.

### 2. Share the folder with it

1. Open the JSON and copy `client_email` (ends `@<project>.iam.gserviceaccount.com`)
2. In Drive, right-click the folder → **Share**
3. Paste that address, give it **Viewer**, and untick "Notify people"

Read-only by design: the connector requests `drive.readonly` and can never modify your documents.

### 3. Get the folder id

From the folder URL, the last path segment:

```
https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J
                                       ^^^^^^^^^^^^^^^^^^^^
```

Nested folders are included automatically.

### 4. Configure the backend

In `.env.local`:

```env
GDRIVE_ENABLED=true
GDRIVE_CREDENTIALS_PATH=./secrets/gdrive-key.json
GDRIVE_FOLDER_ID=1A2B3C4D5E6F7G8H9I0J
SCHEDULER_GDRIVE_ENABLED=true
```

For a **shared drive** rather than My Drive, also set `GDRIVE_DRIVE_ID`.

### 5. Verify and run

```bash
# credentials resolve and the folder is readable
curl -X POST http://localhost:8080/api/v1/connectors/GOOGLE_DRIVE/test

# index everything, ignoring the watermark
curl -X POST "http://localhost:8080/api/v1/connectors/GOOGLE_DRIVE/sync?syncType=FULL"

# confirm the documents answer
curl "http://localhost:8080/api/v1/knowledge/search?query=<something%20in%20your%20docs>&topK=3"
```

---

## How the incremental sync works

```
cron fires (default 02:30 daily)
   |
   v
read watermark from connector_configurations.last_sync_at
   |
   v
Drive: files under folder where modifiedTime > watermark, oldest first
   |
   v
per file: download or export -> Tika -> parse front matter
          -> chunk -> embed -> upsert to Pinecone
   |
   v
advance watermark to the newest file that SUCCEEDED, minus 5 min overlap
```

Four properties of this that matter:

**Failures are retried.** The watermark only advances past files that indexed successfully, so a transient error means that file is picked up next run rather than silently lost.

**Edits do not duplicate.** Vector ids derive from the Drive file id (`gd-<fileId>-<chunkIndex>`), so re-indexing an edited document overwrites its own chunks.

**The 5-minute overlap is deliberate.** A document saved while a sync is in flight would otherwise fall between the watermark and the next query. Re-indexing a file is harmless; missing one is not.

**Runs cannot overlap.** A long first sync will not have the next tick start on top of it.

### Configuration

| Property | Env | Default | Purpose |
|---|---|---|---|
| `gdrive.enabled` | `GDRIVE_ENABLED` | `false` | Master switch |
| `gdrive.credentials-path` | `GDRIVE_CREDENTIALS_PATH` | — | Service account JSON |
| `gdrive.folder-id` | `GDRIVE_FOLDER_ID` | — | Folder to index |
| `gdrive.drive-id` | `GDRIVE_DRIVE_ID` | — | Shared drive only |
| `gdrive.max-files-per-sync` | `GDRIVE_MAX_FILES` | `500` | Safety limit per run |
| `gdrive.watermark-overlap-seconds` | — | `300` | Edge re-check window |
| `scheduler.gdrive.enabled` | `SCHEDULER_GDRIVE_ENABLED` | `false` | Enables the cron |
| `scheduler.gdrive.cron` | `SCHEDULER_GDRIVE_CRON` | `0 30 2 * * ?` | Daily 02:30 |

The default runs 30 minutes after the ServiceNow sync so the two do not compete for embedding quota.

---

## Deletions

A document deleted or moved out of the folder **keeps its vectors**. Drive's `files.list` cannot report what is no longer there, so nothing signals the removal.

Two ways to handle it, neither built yet:

- Track indexed file ids and reconcile against a full listing on each run, deleting the difference
- Use Drive's Changes API, which does report removals but needs a persisted page token

For a POC, `DELETE /api/v1/knowledge/records/{id}` removes a vector by hand. Worth deciding before production — stale answers from a deleted runbook are worse than no answer.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `test` returns false, log says token request failed | Key file unreadable, or Drive API not enabled on the project |
| `test` returns false, 404 on the folder | Folder not shared with `client_email`, or wrong folder id |
| Sync reports 0 fetched on a folder with files | Everything already indexed — the watermark has passed them. Use `syncType=FULL` |
| Files fetched but all skipped | Unsupported types. Check the log for `Skipping unsupported type` |
| Documents indexed but never retrieved | Category mismatch. Check what `Category` resolved to, or drop the front matter to test |
| `403 insufficient permissions` on shared drive | Set `GDRIVE_DRIVE_ID` as well as the folder id |
