# ServiceNow AI Service Desk - Complete Setup Walkthrough

## Overview
This guide walks you through setting up the AI Service Desk plugin in ServiceNow. When an agent types a ticket description, the system searches the knowledge base and suggests similar resolved incidents.

---

## Prerequisites

| Requirement | Status |
|-------------|--------|
| Backend running on `http://localhost:8080` | Verify: `http://localhost:8080/actuator/health` returns `{"status":"UP"}` |
| Cloudflare Tunnel running | Current URL: `https://sciences-tap-museum-insulation.trycloudflare.com` |
| ServiceNow admin access | Instance: `dev440425.service-now.com` |
| Browser with DevTools access | Press F12 to open |

---

## Step 1: Verify Backend is Reachable

Open your browser and go to:
```
https://sciences-tap-museum-insulation.trycloudflare.com/actuator/health
```

**Expected result:** You should see `{"status":"UP"}`

If this fails, the tunnel is down. Restart it.

---

## Step 2: Create Script Include

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
| **Active** | Γÿæ Checked |
| **Client callable** | Γÿæ **MUST BE CHECKED** |
| **Accessible from** | `All application scopes` |
| **Use sandbox script** | ΓÿÉ Unchecked |

6. In the **Script** field, paste this EXACT code (no modifications):

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

7. Click **Submit** button

### Important Notes for Step 2:
- If you **don't see "Client callable"** checkbox, look for "Accessible from" field and set it to `All application scopes`
- Make sure the Script field contains the EXACT code above
- Do NOT add extra spaces or characters

---

## Step 3: Create Client Script

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
| **Active** | Γÿæ Checked |
| **UI Type** | `All` (or `Desktop` if All is not available) |
| **Global** | Γÿæ Checked |

5. In the **Script** field, paste this EXACT code (no modifications):

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

6. Click **Submit** button

---

## Step 4: Test the Integration

1. **Reload** the Incident form:
   - Go to **Incidents** in the left menu
   - Click **Create New** (or open any existing incident)

2. In the **Short description** field, type:
   ```
   VPN not working
   ```

3. Wait **2 seconds**

4. **Expected results:**
   - A **blue panel** appears with "Searching knowledge base..."
   - Then it shows "Similar Incident(s) Found" with cards
   - OR "No similar incidents found. You may proceed with a new ticket."

5. If suggestions appear:
   - Click **Apply Resolution** to apply the suggested fix
   - OR click **Dismiss** to close a suggestion card

---

## Step 5: Verify in System Logs

If something doesn't work, check the logs:

1. In the filter navigator, type: `System Logs`
2. Click **System Logs > All**
3. In the search bar, type: `[AI Service Desk]`
4. Press Enter
5. Look for any error messages

---

## Troubleshooting

### Problem: No blue panel appears

**Check 1: Browser Console**
1. Press F12 to open DevTools
2. Click **Console** tab
3. Type in Short description field
4. Look for **red error messages**
5. Tell me what you see

**Check 2: Script Include Settings**
1. Go to **System Definition > Script Includes**
2. Open `AIServiceDeskClient`
3. Verify:
   - **Active** = Γÿæ
   - **Client callable** = Γÿæ (or "Accessible from" = "All application scopes")
   - **Script** = exactly matches the code in Step 2

**Check 3: Client Script Settings**
1. Go to **System Definition > Client Scripts**
2. Open `AI - Auto Search Suggestions`
3. Verify:
   - **Active** = Γÿæ
   - **Type** = onChange
   - **Field name** = short_description
   - **Table** = Incident [incident]

### Problem: "Client callable" checkbox not visible

In some ServiceNow versions, this checkbox may be hidden. Instead:
1. Look for **"Accessible from"** field
2. Set it to **"All application scopes"**
3. This has the same effect

### Problem: Panel appears but says "No similar incidents found"

This means the connection works but no matching incidents were found. This is normal if you haven't loaded synthetic data yet.

### Problem: Error in System Logs

Common errors and fixes:

| Error | Fix |
|-------|-----|
| `API returned status 403` | Backend rejected the request - check tunnel URL |
| `API returned status 500` | Backend error - check backend logs |
| `GlideAjax failed` | Script Include not client-callable |
| `JSON parse error` | Backend returned invalid response |

---

## File Locations

All plugin files are saved locally at:
```
D:\POC\ai-service-desk-knowledge-intelligence-platform\service-desk-ai-platform-backend\servicenow-plugin\
```

| File | Purpose |
|------|---------|
| `01-script-include.js` | Server-side Script Include code |
| `02-client-script.js` | Browser-side Client Script code |
| `03-rest-message.json` | REST Message configuration (optional) |
| `README.md` | Quick reference guide |

---

## Architecture Flow

```
Agent types in Short description
        |
        v
Client Script (onChange) fires
        |
        v
GlideAjax calls AIServiceDeskClient.getSuggestions()
        |
        v
Script Include calls AI backend via REST
        |
        v
POST https://sciences-tap-museum-insulation.trycloudflare.com/api/v1/suggestions/resolve
        |
        v
AI backend searches Pinecone vector database
        |
        v
Returns similar incidents with relevance scores
        |
        v
Client Script renders blue suggestion panel
        |
        v
Agent clicks "Apply Resolution" to auto-fill
```

---

## Quick Reference Card

| Item | Value |
|------|-------|
| ServiceNow Instance | `https://dev440425.service-now.com` |
| Backend Tunnel | `https://sciences-tap-museum-insulation.trycloudflare.com` |
| Script Include Name | `AIServiceDeskClient` |
| Client Script Name | `AI - Auto Search Suggestions` |
| Trigger Field | `short_description` |
| Min Characters | 10 |
| Delay Before Search | 1.5 seconds |
| API Endpoint | `/api/v1/suggestions/resolve` |

---

## When Cloudflare Tunnel Restarts

Cloudflare tunnels generate a **new URL** on each restart. When this happens:

1. Note the new URL from the terminal
2. Update the Script Include:
   - Go to **System Definition > Script Includes**
   - Open `AIServiceDeskClient`
   - Find the old URL in the Script field
   - Replace with the new URL
   - Click **Update**
3. Test again

---

## Need Help?

If you're stuck, check:
1. Is the backend running? (`http://localhost:8080/actuator/health`)
2. Is the tunnel running? (check terminal)
3. Is the Script Include client-callable?
4. Are there errors in the Console tab (F12)?
5. Are there errors in System Logs?

Report any issues with:
- Screenshot of the Console tab
- Screenshot of System Logs
- The exact error message
