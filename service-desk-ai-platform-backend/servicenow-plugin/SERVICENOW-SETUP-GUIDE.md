# ServiceNow AI Plugin — Step-by-Step Setup Guide

## Prerequisites

Before starting, ensure:
1. Backend is running: `http://localhost:8080/actuator/health` returns `{"status":"UP"}`
2. Cloudflare Tunnel is running (see below)
3. You have ServiceNow admin access

---

## Step 0: Cloudflare Tunnel Setup

Since the app is running locally and ServiceNow needs to reach it from the cloud, we need a public URL.

### Install cloudflared

```bash
npm install -g cloudflared
```

Or download from: `https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/`

### Start the Tunnel

```bash
cloudflared tunnel --url http://localhost:8080
```

This displays a URL like:
```
https://sciences-tap-museum-insulation.trycloudflare.com
```

### Verify Tunnel Works

Open in browser:
```
https://sciences-tap-museum-insulation.trycloudflare.com/actuator/health
```

Should return: `{"status":"UP"}`

**Note:** This URL changes on each restart. Update ServiceNow when it changes.

---

## Phase 1: ServiceNow Backend

### Step 1: Create REST Message

1. Log in to ServiceNow: `https://dev440425.service-now.com`
2. In filter navigator, type: `REST Message`
3. Navigate to: **System Web Services > Outbound > REST Message**
4. Click **New**
5. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `AI_ServiceDesk_Suggest` |
| **Endpoint** | `https://sciences-tap-museum-insulation.trycloudflare.com` |
| **Authentication** | `No Authentication` |
| **Content Type** | `application/json` |

6. In the **HTTP Methods** related list, click **New**:

| Field | Value |
|-------|-------|
| **Name** | `getSuggestions` |
| **HTTP Method** | `POST` |
| **Endpoint** | `https://sciences-tap-museum-insulation.trycloudflare.com/api/v1/suggestions/resolve` |

7. Add **HTTP Request Headers**:

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |

8. Add **HTTP Request Query Parameter**:

| Name | Value |
|------|-------|
| `title` | `${title}` |
| `description` | `${description}` |

9. Set **HTTP Request Body**:

```json
{
  "title": "${title}",
  "description": "${description}",
  "minConfidenceThreshold": 70
}
```

10. Click **Submit**

---

### Step 2: Create Script Include

1. In filter navigator, type: `Script Includes`
2. Navigate to: **System Definition > Script Includes**
3. Click **New**
4. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `AIServiceDeskClient` |
| **API Name** | `global.AIServiceDeskClient` |
| **Description** | `AI Service Desk - Get Suggestions` |
| **Active** | ☑ Checked |
| **Client Callable** | ☑ **MUST BE CHECKED** |
| **Accessible from** | `All application scopes` |
| **Use sandbox script** | ☐ Unchecked |

5. Paste this EXACT code in the **Script** field:

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

6. Click **Submit**

**Note:** If "Client callable" checkbox is missing, look for "Accessible from" field and set it to `All application scopes`.

---

## Phase 2: Service Portal Widget

### Step 3: Create Portal Widget

1. In filter navigator, type: `Widgets`
2. Navigate to: **Service Portal > Widgets**
3. Click **New**
4. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `AI Suggestion Panel` |
| **ID** | `ai-suggestion-panel` |
| **Active** | ☑ Checked |

5. Add the following files:

---

#### HTML Template

Paste this in the **HTML Template** tab:

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

---

#### CSS Styles

Paste this in the **CSS** tab:

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

#### Client Script (AngularJS)

Paste this in the **Client Script** tab:

```javascript
api.controller = function($scope, $timeout) {
    var c = this;
    $scope.data = c.data;
    $scope.data.suggestions = [];

    $scope.applyResolution = function(suggestion) {
        var resolution = suggestion.resolution || suggestion.resolutionNotes || '';
        var current = g_form.getValue('resolution_notes') || '';
        var newResolution = current ? current + '\n\n--- AI Suggested ---\n' + resolution : resolution;
        g_form.setValue('resolution_notes', newResolution);
        g_form.setValue('state', '6');
        g_form.setValue('close_code', 'Closed/Resolved by Caller');
        g_form.addInfoMessage('AI resolution applied from ' + (suggestion.incidentNumber || suggestion.number));
    };

    $scope.dismissCard = function(index) {
        $scope.data.suggestions.splice(index, 1);
    };
};
```

6. Click **Submit**

---

## Phase 3: Form Integration

### Step 4: Add Client Script to Incident Form

1. In filter navigator, type: `Client Scripts`
2. Navigate to: **System Definition > Client Scripts**
3. Click **New**
4. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `AI_Suggestion_On_Type` |
| **Table** | `Incident [incident]` |
| **Type** | `onChange` |
| **Field name** | `description` |
| **Active** | ☑ Checked |
| **UI Type** | `All` |
| **Global** | ☑ Checked |

5. Paste this EXACT code in the **Script** field:

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

### Step 5: Add Widget to Incident Form

Choose one option:

**Option A: Add via UI Macro on the form header**
1. Navigate to: **System UI > UI Macros**
2. Create a new macro that includes the widget
3. Add it to the Incident form header

**Option B: Add via Agent Workspace widget panel**
1. Open Agent Workspace
2. Edit the Incident form layout
3. Add the `ai-suggestion-panel` widget to the form

**Option C: Add via Service Portal page**
1. Navigate to: **Service Portal > Pages**
2. Edit the Incident form page
3. Add the `ai-suggestion-panel` widget

---

## Phase 4: User Flow

```
User types description
        |
        v
Debounced (1.5s wait)
        |
        v
Script Include calls our API
        |
        v
Returns similar incidents + resolutions
        |
        v
Widget displays suggestion cards
        |
        v
User clicks "Apply Resolution" or "Submit Anyway"
```

---

## Testing

### Test 1: Verify Backend is Reachable

```bash
curl https://sciences-tap-museum-insulation.trycloudflare.com/actuator/health
```

Expected: `{"status":"UP"}`

### Test 2: Verify API Returns Suggestions

```bash
curl "https://sciences-tap-museum-insulation.trycloudflare.com/api/v1/suggestions/resolve" \
  -H "Content-Type: application/json" \
  -d '{"query": "VPN not working", "maxResults": 3}'
```

Expected: JSON response with similar incidents

### Test 3: Test in ServiceNow

1. Open ServiceNow: `https://dev440425.service-now.com`
2. Navigate to: **Incidents > Create New**
3. In **Description** field, type: `VPN not working`
4. Wait 2 seconds
5. **Expected:** Blue panel appears with suggestions

### Test 4: Check Console Logs

1. Press F12 in browser
2. Click **Console** tab
3. Look for any red errors
4. Verify `xmlhttp` calls show 200 status

---

## Troubleshooting

### Problem: No blue panel appears

**Check 1: Browser Console**
1. Press F12
2. Click Console tab
3. Look for red errors
4. Tell me what you see

**Check 2: Script Include Settings**
1. Go to **System Definition > Script Includes**
2. Open `AIServiceDeskClient`
3. Verify:
   - **Active** = ☑
   - **Client Callable** = ☑
   - **Accessible from** = `All application scopes`

**Check 3: Client Script Settings**
1. Go to **System Definition > Client Scripts**
2. Open `AI_Suggestion_On_Type`
3. Verify:
   - **Active** = ☑
   - **Type** = onChange
   - **Field name** = description
   - **Table** = Incident [incident]

### Problem: "Client callable" checkbox not visible

In some ServiceNow versions:
1. Look for **"Accessible from"** field
2. Set to **"All application scopes"**
3. This has the same effect

### Problem: Cloudflare tunnel URL changed

Cloudflare tunnels generate new URLs on restart:

1. Note the new URL from terminal
2. Update Script Include:
   - Go to **System Definition > Script Includes**
   - Open `AIServiceDeskClient`
   - Find old URL in Script field
   - Replace with new URL
   - Click **Update**

### Problem: Error in System Logs

1. Go to **System Logs > All**
2. Filter by message containing `[AI Service Desk]`
3. Look for error messages

---

## Quick Reference

| Item | Value |
|------|-------|
| ServiceNow Instance | `https://dev440425.service-now.com` |
| Tunnel URL | `https://sciences-tap-museum-insulation.trycloudflare.com` |
| REST Message Name | `AI_ServiceDesk_Suggest` |
| Script Include Name | `AIServiceDeskClient` |
| Client Script Name | `AI_Suggestion_On_Type` |
| Portal Widget Name | `AI Suggestion Panel` |
| Trigger Field | `description` |
| Min Characters | 10 |
| Delay Before Search | 1.5 seconds |
| API Endpoint | `/api/v1/suggestions/resolve` |

---

## File Locations

All plugin files are saved locally at:
```
D:\POC\ai-service-desk-knowledge-intelligence-platform\service-desk-ai-platform-backend\servicenow-plugin\
```

| File | Purpose |
|------|---------|
| `01-script-include.js` | Script Include code |
| `02-client-script.js` | Client Script code |
| `03-rest-message.json` | REST Message configuration |
| `widget/html-template.html` | Portal Widget HTML |
| `widget/css-styles.css` | Portal Widget CSS |
| `widget/client-script.js` | Portal Widget AngularJS |
| `README.md` | Quick reference |
| `SERVICENOW-SETUP-GUIDE.md` | This guide |
