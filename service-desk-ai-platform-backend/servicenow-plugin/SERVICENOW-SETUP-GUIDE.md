# AI Service Desk - Complete End-to-End Setup Guide

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Backend Setup](#backend-setup)
4. [External Services Configuration](#external-services-configuration)
5. [Data Ingestion](#data-ingestion)
6. [Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
7. [ServiceNow Plugin Setup](#servicenow-plugin-setup)
8. [Testing the Integration](#testing-the-integration)
9. [Troubleshooting](#troubleshooting)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ServiceNow Instance                         │
│                    (dev440425.service-now.com)                      │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  Client Script   │───▶│  Script Include   │───▶│  REST Call    │  │
│  │  (onChange)      │    │  (GlideAjax)     │    │  (HTTP POST)  │  │
│  └─────────────────┘    └──────────────────┘    └───────┬───────┘  │
└─────────────────────────────────────────────────────────┼───────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Cloudflare Tunnel                                │
│        (sciences-tap-museum-insulation.trycloudflare.com)           │
└─────────────────────────────────────────────────────────┼───────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Spring Boot Backend                              │
│                    (localhost:8080)                                  │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  REST Controller │───▶│  Suggestion      │───▶│  Pinecone     │  │
│  │  /suggestions/* │    │  Engine          │    │  Vector DB    │  │
│  └─────────────────┘    └──────────────────┘    └───────┬───────┘  │
│                                                          │          │
│  ┌─────────────────┐    ┌──────────────────┐             │          │
│  │  Embedding      │───▶│  Gemini API      │             │          │
│  │  Service        │    │  (batchEmbed)    │             │          │
│  └─────────────────┘    └──────────────────┘             │          │
└─────────────────────────────────────────────────────────┼───────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    External Services                                │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  Pinecone       │    │  Google Gemini   │    │  ServiceNow   │  │
│  │  Vector DB      │    │  Embeddings      │    │  REST API     │  │
│  │  (1024-dim)     │    │  (1024-dim)      │    │  (OAuth2)     │  │
│  └─────────────────┘    └──────────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Requirement | Details | How to Verify |
|-------------|---------|---------------|
| Java 17+ | OpenJDK or Oracle JDK | `java -version` |
| Maven 3.8+ | Build tool | `mvn -version` |
| ServiceNow Developer Instance | Free tier OK | `https://dev440425.service-now.com` |
| Google Cloud Project | For Gemini API | Console: `console.cloud.google.com` |
| Pinecone Account | Free tier OK | `app.pinecone.io` |
| Node.js 18+ | For Cloudflare tunnel | `node -v` |
| Git | Version control | `git --version` |

---

## Backend Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/latecoder10/servicenow-ai-deflection-plugin.git
cd servicenow-ai-deflection-plugin/service-desk-ai-platform-backend
```

### Step 2: Configure Environment Variables

Create `.env` file in the project root:

```env
# Google Gemini API Key
GOOGLE_AI_API_KEY=your_gemini_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=servicedesk-knowledge
PINECONE_NAMESPACE=default

# ServiceNow Configuration
SERVICENOW_INSTANCE_URL=https://dev440425.service-now.com
SERVICENOW_USERNAME=your_servicenow_username
SERVICENOW_PASSWORD=your_servicenow_password
SERVICENOW_CLIENT_ID=your_oauth_client_id
SERVICENOW_CLIENT_SECRET=your_oauth_client_secret

# Server Configuration
SERVER_PORT=8080
```

### Step 3: Build the Project

```bash
mvn clean install -DskipTests
```

### Step 4: Start the Backend

```bash
mvn spring-boot:run -pl api
```

Verify it's running:
```
http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

---

## External Services Configuration

### A. Google Gemini API (Embeddings)

1. Go to Google AI Studio: `https://aistudio.google.com/apikey`
2. Create an API key
3. Add to `.env`: `GOOGLE_AI_API_KEY=your_key`

**Model:** `gemini-embedding-001` (1024 dimensions)

### B. Pinecone (Vector Database)

1. Sign up at `https://app.pinecone.io`
2. Create index:
   - Name: `servicedesk-knowledge`
   - Dimension: `1024`
   - Metric: `cosine`
3. Copy API key to `.env`: `PINECONE_API_KEY=your_key`

### C. ServiceNow OAuth2

1. Log in to ServiceNow: `https://dev440425.service-now.com`
2. Navigate to **System OAuth > Application Registry**
3. Click **New**
4. Select **Create an OAuth API endpoint**
5. Fill in:
   - Name: `AI Service Desk`
   - Client ID: (auto-generated)
   - Client Secret: (auto-generated)
6. Copy credentials to `.env`

**Required Scopes:**
- `incident_table`
- `sys_user_table`

---

## Data Ingestion

### Step 1: Load Synthetic Data

The project includes 20 synthetic IT support incidents. Load them into ServiceNow:

```bash
curl -X POST http://localhost:8080/api/v1/knowledge/load-synthetic
```

Expected response:
```json
{
  "loaded": 20,
  "status": "success"
}
```

### Step 2: Sync to Vector Database

Trigger a knowledge sync from ServiceNow to Pinecone:

```bash
curl -X POST http://localhost:8080/api/v1/knowledge/sync
```

This will:
1. Fetch incidents from ServiceNow
2. Chunk text into 512-token segments
3. Generate embeddings via Gemini batch API
4. Upsert vectors to Pinecone in batches of 96

**Vector ID Format:** `sn-{sysId}-{chunkIndex}`

### Step 3: Verify Vector Count

```bash
curl http://localhost:8080/api/v1/analytics/vector-count
```

Expected: ~200-400 vectors (10-20 chunks per incident)

### Step 4: Test Search

```bash
curl "http://localhost:8080/api/v1/suggestions/resolve" \
  -H "Content-Type: application/json" \
  -d '{"query": "VPN not working", "maxResults": 3}'
```

Expected: JSON with similar incidents and relevance scores

---

## Cloudflare Tunnel Setup

### Step 1: Install Cloudflare Tunnel

```bash
npm install -g cloudflared
```

Or download from: `https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/`

### Step 2: Start the Tunnel

```bash
cloudflared tunnel --url http://localhost:8080
```

This will display a URL like:
```
https://sciences-tap-museum-insulation.trycloudflare.com
```

**IMPORTANT:** This URL changes on each restart. You'll need to update ServiceNow when it changes.

### Step 3: Verify Tunnel

Open the tunnel URL in browser:
```
https://sciences-tap-museum-insulation.trycloudflare.com/actuator/health
```

Should return: `{"status":"UP"}`

---

## ServiceNow Plugin Setup

### Overview

The plugin consists of:
1. **Script Include** - Server-side code that calls the AI backend
2. **Client Script** - Browser-side code that triggers on description changes
3. **Service Portal Widget** (optional) - Visual dashboard for suggestions

---

### Part A: Create Script Include

The Script Include is a server-side script that GlideAjax calls from the browser.

1. Log in to ServiceNow: `https://dev440425.service-now.com`
2. In the **filter navigator** (top-left search box), type: `Script Includes`
3. Click **System Definition > Script Includes**
4. Click **New** button (top-right corner)
5. Fill in these fields exactly:

| Field | Value |
|-------|-------|
| **Name** | `AIServiceDeskClient` |
| **API Name** | `global.AIServiceDeskClient` (should auto-populate) |
| **Description** | `AI Service Desk - Get Suggestions` |
| **Active** | ☑ Checked |
| **Client callable** | ☑ **MUST BE CHECKED** |
| **Accessible from** | `All application scopes` |
| **Use sandbox script** | ☐ Unchecked |

6. In the **Script** field, paste this EXACT code:

```javascript
var AIServiceDeskClient = Class.create();
AIServiceDeskClient.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    getSuggestions: function() {
        var description = this.getParameter('sysparm_description');

        if (!description || description.trim().length === 0) {
            return JSON.stringify({ suggestions: [], message: 'No description provided' });
        }

        try {
            var restMessage = new sn_ws.RESTMessageV2();
            restMessage.setEndpoint('https://sciences-tap-museum-insulation.trycloudflare.com/api/v1/suggestions/resolve');
            restMessage.setHttpMethod('POST');
            restMessage.setRequestHeader('Content-Type', 'application/json');
            restMessage.setHttpTimeout(10000);

            var body = {
                title: description.substring(0, 100),
                description: description,
                minConfidenceThreshold: 70
            };

            restMessage.setRequestBody(JSON.stringify(body));
            var response = restMessage.execute();
            var httpStatus = response.getStatusCode();

            if (httpStatus === 200) {
                return response.getBody();
            } else {
                gs.error('[AI Service Desk] API returned status ' + httpStatus);
                return JSON.stringify({ suggestions: [], error: 'API status ' + httpStatus });
            }
        } catch (e) {
            gs.error('[AI Service Desk] getSuggestions failed: ' + e.getMessage());
            return JSON.stringify({ suggestions: [], error: e.getMessage() });
        }
    },

    type: 'AIServiceDeskClient'
});
```

7. Click **Submit**

**IMPORTANT:** If you don't see "Client callable" checkbox, look for "Accessible from" field and set it to `All application scopes`.

---

### Part B: Create Client Script

The Client Script runs in the browser and calls the Script Include when the agent types.

1. In the **filter navigator**, type: `Client Scripts`
2. Click **System Definition > Client Scripts**
3. Click **New** button (top-right corner)
4. Fill in these fields exactly:

| Field | Value |
|-------|-------|
| **Name** | `AI - Auto Search Suggestions` |
| **Table** | `Incident [incident]` |
| **Type** | `onChange` |
| **Field name** | `short_description` |
| **Active** | ☑ Checked |
| **UI Type** | `All` (or `Desktop` if All is not available) |
| **Global** | ☑ Checked |

5. In the **Script** field, paste this EXACT code:

```javascript
function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading) return;

    try {
        var container = document.getElementById('ai-suggestion-container');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }

        if (!newValue || newValue.length < 10) {
            return;
        }

        if (window._aiSearchTimeout) {
            clearTimeout(window._aiSearchTimeout);
        }

        window._aiSearchTimeout = setTimeout(function() {
            searchAISuggestions(newValue);
        }, 1500);
    } catch(e) {}
}

function searchAISuggestions(description) {
    try {
        var container = getOrCreateContainer();
        container.innerHTML = '<div style="padding:16px;text-align:center;color:#666;"><b>Searching knowledge base...</b></div>';
        container.style.display = 'block';

        var ga = new GlideAjax('AIServiceDeskClient');
        ga.addParam('sysparm_name', 'getSuggestions');
        ga.addParam('sysparm_description', description);
        ga.getXMLAnswer(function(response) {
            try {
                var result = JSON.parse(response);
                displayAISuggestions(result);
            } catch (e) {
                container.style.display = 'none';
            }
        });
    } catch(e) {}
}

function displayAISuggestions(result) {
    var container = getOrCreateContainer();
    var suggestions = [];

    if (result.similarIncidents && result.similarIncidents.length > 0) {
        suggestions = result.similarIncidents;
    } else if (result.results && result.results.length > 0) {
        suggestions = result.results;
    } else if (result.suggestions && result.suggestions.length > 0) {
        suggestions = result.suggestions;
    }

    if (suggestions.length === 0) {
        container.innerHTML = '<div style="padding:16px;text-align:center;color:#888;">No similar incidents found. You may proceed with a new ticket.</div>';
        container.style.display = 'block';
        return;
    }

    window._aiSuggestions = suggestions;

    var html = '<div style="font-weight:600;margin-bottom:12px;color:#333;">' + suggestions.length + ' Similar Incident(s) Found</div>';

    for (var i = 0; i < Math.min(suggestions.length, 3); i++) {
        var s = suggestions[i];
        var title = s.title || s.short_description || s.textContent || 'Untitled';
        var resolution = s.resolution || s.resolutionNotes || '';
        var score = s.relevanceScore ? Math.round(s.relevanceScore * 100) + '%' : '';
        var number = s.incidentNumber || s.number || s.documentId || '';

        html += '<div id="ai-card-' + i + '" style="background:white;border:1px solid #ddd;border-radius:6px;padding:12px;margin-bottom:8px;">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">';
        html += '<span style="color:#667eea;font-weight:600;font-size:12px;">' + number + '</span>';
        html += '<span style="background:#28a745;color:white;padding:2px 8px;border-radius:10px;font-size:11px;">' + score + '</span>';
        html += '</div>';
        html += '<div style="font-weight:500;margin-bottom:6px;">' + title.substring(0, 80) + '</div>';

        if (resolution) {
            html += '<div style="font-size:13px;color:#555;margin-bottom:8px;"><b>Resolution:</b> ' + resolution.substring(0, 200) + '</div>';
        }

        html += '<div style="display:flex;gap:8px;">';
        html += '<button style="background:#28a745;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;" onclick="applyAIResolution(' + i + ')">Apply Resolution</button>';
        html += '<button style="background:none;border:1px solid #ddd;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;" onclick="dismissAICard(' + i + ')">Dismiss</button>';
        html += '</div></div>';
    }

    html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #ddd;">';
    html += '<button style="width:100%;background:#667eea;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-size:13px;" onclick="g_form.submit()">Submit New Ticket Anyway</button>';
    html += '</div>';

    container.innerHTML = html;
    container.style.display = 'block';
}

function applyAIResolution(index) {
    var s = window._aiSuggestions[index];
    if (!s) return;
    var resolution = s.resolution || s.resolutionNotes || s.textContent || '';
    var current = g_form.getValue('resolution_notes') || '';
    var newResolution = current ? current + '\n\n--- AI Suggested ---\n' + resolution : resolution;
    g_form.setValue('resolution_notes', newResolution);
    g_form.setValue('state', '6');
    g_form.setValue('close_code', 'Closed/Resolved by Caller');
    g_form.addInfoMessage('AI resolution applied from ' + (s.incidentNumber || s.number || 'suggestion'));
}

function dismissAICard(index) {
    var card = document.getElementById('ai-card-' + index);
    if (card) card.style.display = 'none';
}

function getOrCreateContainer() {
    var container = document.getElementById('ai-suggestion-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ai-suggestion-container';
        container.style.cssText = 'margin:10px 0;padding:12px;background:#f0f4ff;border:1px solid #667eea;border-radius:8px;font-family:sans-serif;';

        var form = document.querySelector('.form_body') || document.querySelector('.section_div') || document.body;
        if (form) {
            form.insertBefore(container, form.firstChild);
        }
    }
    return container;
}
```

6. Click **Submit**

---

### Part C: Service Portal Widget (Optional)

For a richer experience, create a Service Portal widget.

#### HTML Template

Create a new widget or use this HTML:

```html
<div class="ai-suggestion-panel" ng-if="data.suggestions.length > 0">
    <div class="panel-header">
        <h3>AI Suggestions ({{data.suggestions.length}})</h3>
    </div>
    <div class="suggestion-card" ng-repeat="s in data.suggestions | limitTo:3">
        <div class="card-header">
            <span class="incident-number">{{s.incidentNumber || s.number}}</span>
            <span class="relevance-score">{{s.relevanceScore * 100 | number:0}}%</span>
        </div>
        <div class="card-title">{{s.title || s.short_description}}</div>
        <div class="card-resolution" ng-if="s.resolution">
            <strong>Resolution:</strong> {{s.resolution | limitTo:200}}
        </div>
        <div class="card-actions">
            <button class="btn btn-success btn-sm" ng-click="applyResolution(s)">
                Apply Resolution
            </button>
            <button class="btn btn-default btn-sm" ng-click="dismissCard($index)">
                Dismiss
            </button>
        </div>
    </div>
</div>
```

#### CSS Styles

```css
.ai-suggestion-panel {
    margin: 15px 0;
    padding: 15px;
    background: #f0f4ff;
    border: 1px solid #667eea;
    border-radius: 8px;
    font-family: 'ServiceNow', sans-serif;
}

.panel-header h3 {
    margin: 0 0 15px 0;
    color: #333;
    font-size: 16px;
}

.suggestion-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 10px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.incident-number {
    color: #667eea;
    font-weight: 600;
    font-size: 12px;
}

.relevance-score {
    background: #28a745;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
}

.card-title {
    font-weight: 500;
    margin-bottom: 8px;
}

.card-resolution {
    font-size: 13px;
    color: #555;
    margin-bottom: 10px;
}

.card-actions {
    display: flex;
    gap: 8px;
}
```

---

## Testing the Integration

### Test 1: Backend Health Check

```bash
curl http://localhost:8080/actuator/health
```

Expected: `{"status":"UP"}`

### Test 2: Tunnel Health Check

```bash
curl https://sciences-tap-museum-insulation.trycloudflare.com/actuator/health
```

Expected: `{"status":"UP"}`

### Test 3: API Search Test

```bash
curl "http://localhost:8080/api/v1/suggestions/resolve" \
  -H "Content-Type: application/json" \
  -d '{"query": "VPN not working", "maxResults": 3}'
```

Expected: JSON response with similar incidents

### Test 4: ServiceNow Integration

1. Open ServiceNow: `https://dev440425.service-now.com`
2. Navigate to **Incidents > Create New**
3. In **Short description**, type: `VPN not working`
4. Wait 2 seconds
5. **Expected:** Blue panel appears with suggestions

### Test 5: Check Console Logs

1. Press F12 in browser
2. Click **Console** tab
3. Look for any red errors
4. Verify `xmlhttp` calls show 200 status

---

## Troubleshooting

### Problem: Backend Won't Start

**Symptoms:** `mvn spring-boot:run` fails

**Fix:**
1. Check `.env` file has all required variables
2. Verify Java version: `java -version`
3. Check port 8080 isn't in use: `netstat -ano | findstr :8080`

### Problem: Pinecone Connection Failed

**Symptoms:** `Failed to connect to Pinecone`

**Fix:**
1. Verify `PINECONE_API_KEY` in `.env`
2. Check index name matches: `servicedesk-knowledge`
3. Verify dimension is 1024

### Problem: Gemini Embedding Error

**Symptoms:** `Failed to generate embeddings`

**Fix:**
1. Verify `GOOGLE_AI_API_KEY` in `.env`
2. Check API quota not exceeded
3. Verify model: `gemini-embedding-001`

### Problem: ServiceNow 403 Error

**Symptoms:** `API returned status 403`

**Fix:**
1. Verify OAuth credentials in `.env`
2. Check user has required roles
3. Verify REST message is active

### Problem: No Blue Panel in ServiceNow

**Symptoms:** Type description but nothing happens

**Check 1: Browser Console**
1. Press F12
2. Click Console tab
3. Look for red errors
4. Verify `xmlhttp` calls appear

**Check 2: Script Include Settings**
1. Go to **System Definition > Script Includes**
2. Open `AIServiceDeskClient`
3. Verify:
   - **Active** = ☑
   - **Client callable** = ☑
   - **Accessible from** = `All application scopes`

**Check 3: Client Script Settings**
1. Go to **System Definition > Client Scripts**
2. Open `AI - Auto Search Suggestions`
3. Verify:
   - **Active** = ☑
   - **Type** = onChange
   - **Field name** = short_description

### Problem: "Client callable" Checkbox Missing

In some ServiceNow versions:
1. Look for **"Accessible from"** field
2. Set to **"All application scopes"**
3. This has the same effect

### Problem: Cloudflare Tunnel URL Changed

Cloudflare tunnels generate new URLs on restart:

1. Note the new URL from terminal
2. Update Script Include:
   - Go to **System Definition > Script Includes**
   - Open `AIServiceDeskClient`
   - Find old URL in Script field
   - Replace with new URL
   - Click **Update**

---

## Key Files Reference

| File | Location | Purpose |
|------|----------|---------|
| `.env` | Project root | Environment variables |
| `AppConstants.java` | `domain/src/main/java/.../domain/` | Centralized constants |
| `PineconeVectorAdapter.java` | `integration/pinecone/...` | Vector DB operations |
| `SpringAiEmbeddingAdapter.java` | `integration/llm/...` | Gemini embeddings |
| `ServiceNowRestAdapter.java` | `integration/servicenow/...` | ServiceNow API calls |
| `ServiceNowKnowledgeConnector.java` | `application/connector/...` | Knowledge sync |
| `SyntheticDataLoader.java` | `application/service/...` | Sample data loader |
| `SuggestionEngineService.java` | `application/service/...` | Suggestion logic |
| `SERVICENOW-SETUP-GUIDE.md` | `servicenow-plugin/` | This guide |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/actuator/health` | GET | Health check |
| `/api/v1/suggestions/resolve` | POST | Get suggestions |
| `/api/v1/knowledge/search` | GET | Search knowledge base |
| `/api/v1/knowledge/sync` | POST | Sync to vector DB |
| `/api/v1/knowledge/load-synthetic` | POST | Load sample data |
| `/api/v1/analytics/vector-count` | GET | Count vectors |

---

## Configuration Constants

All constants are centralized in `AppConstants.java`:

```java
public final class AppConstants {
    // Vector ID prefix
    public static final String VECTOR_ID_PREFIX = "sn-";
    
    // Collection names
    public static final String DEFAULT_NAMESPACE = "default";
    public static final String KNOWLEDGE_COLLECTION = "knowledge";
    
    // Batch sizes
    public static final int EMBEDDING_BATCH_SIZE = 100;
    public static final int UPSERT_BATCH_SIZE = 96;
    
    // Text processing
    public static final int CHUNK_SIZE = 512;
    public static final int CHUNK_OVERLAP = 50;
    
    // Similarity threshold
    public static final double MIN_RELEVANCE_SCORE = 0.7;
}
```

---

## Quick Reference Card

| Item | Value |
|------|-------|
| Backend URL | `http://localhost:8080` |
| Tunnel URL | `https://sciences-tap-museum-insulation.trycloudflare.com` |
| ServiceNow | `https://dev440425.service-now.com` |
| Script Include | `AIServiceDeskClient` |
| Client Script | `AI - Auto Search Suggestions` |
| Trigger Field | `short_description` |
| Min Characters | 10 |
| Delay | 1.5 seconds |
| Embedding Model | `gemini-embedding-001` |
| Vector Dimension | 1024 |
| Pinecone Index | `servicedesk-knowledge` |

---

## Need Help?

1. Check backend logs: `logs/servicedesk-ai.log`
2. Check ServiceNow System Logs: Filter by `[AI Service Desk]`
3. Check browser Console (F12)
4. Verify all services are running
5. Report issues with screenshots and error messages
