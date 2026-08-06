# ServiceNow AI Suggestion Plugin

Real-time AI-powered resolution suggestions on the Incident creation form.

## Prerequisites

1. **Cloudflare Tunnel** running and accessible
2. **AI Service Desk Backend** running on localhost:8080
3. **ServiceNow Instance** with admin access

## Current Tunnel URL

```
https://currencies-history-deadline-unlikely.trycloudflare.com
```

> **Note:** Tunnel URL changes on restart. Update Script Include if URL changes.

---

## Setup Instructions

### Step 1: Create Script Include

1. Navigate to: **System Definition > Script Includes**
2. Click **New**
3. Fill in:
   - **Name:** `AIServiceDeskClient`
   - **Client callable:** ☑ Checked
   - **Accessible from:** All application scopes
   - **Script:** Copy content from `01-script-include.js`
4. Click **Submit**

### Step 2: Create Client Script (onChange)

1. Navigate to: **System Definition > Client Scripts**
2. Click **New**
3. Fill in:
   - **Name:** `AI_Suggestion_On_Type`
   - **Table:** `incident`
   - **Type:** `onChange`
   - **Field name:** `short_description`
   - **UI Type:** Both
   - **Script:** Copy content from `02-client-script.js`
4. Click **Submit**

### Step 3: (Optional) Create Service Portal Widget

If using Service Portal instead of classic form:

1. Navigate to: **Service Portal > Widgets**
2. Click **New**
3. Fill in:
   - **Name:** `ai-suggestion-panel`
   - **HTML Template:** Copy content from `widget/html-template.html`
   - **CSS:** Copy content from `widget/css-styles.css`
   - **Client Script:** Copy content from `widget/client-script.js`
4. Click **Submit**

Then add the widget to your Incident form page.

### Step 4: (Optional) Create REST Message

The Script Include uses `sn_ws.RESTMessageV2` directly, so REST Message is optional. But if you want to manage it in ServiceNow:

1. Navigate to: **System Web Services > Outbound > REST Message**
2. Click **New**
3. Fill in:
   - **Name:** `AI_ServiceDesk_Suggest`
   - **Endpoint:** `https://currencies-history-deadline-unlikely.trycloudflare.com`
4. Add HTTP Method:
   - **Name:** `getSuggestions`
   - **HTTP Method:** POST
   - **Endpoint:** `/api/v1/suggestions/resolve`
5. Click **Submit**

---

## How It Works

```
User types description (10+ chars)
        ↓
Debounce (1.5 seconds)
        ↓
GlideAjax calls AIServiceDeskClient.getSuggestions()
        ↓
Script Include calls AI backend via REST
        ↓
AI backend searches Pinecone for similar incidents
        ↓
Returns similar resolved incidents + resolutions
        ↓
Suggestions displayed below the description field
        ↓
User can: "Apply Resolution" or "Submit New Ticket"
```

---

## User Flow

1. **Agent opens new Incident form**
2. **Types description:** "VPN keeps disconnecting every 30 minutes"
3. **After 1.5s pause**, AI searches knowledge base
4. **Panel appears** with similar resolved incidents:
   - INC001234 - "VPN connection drops" - 92% match
   - INC005678 - "GlobalProtect timeout error" - 85% match
5. **Agent clicks "Apply Resolution"** → Resolution copied, state set to Resolved
6. **Or clicks "Submit New Ticket"** → Normal incident creation flow

---

## File Structure

```
servicenow-plugin/
├── 01-script-include.js      # AIServiceDeskClient Script Include
├── 02-client-script.js        # onChange Client Script for Incident form
├── 03-rest-message.json       # REST Message configuration (optional)
├── widget/
│   ├── html-template.html     # Service Portal Widget HTML
│   ├── css-styles.css         # Service Portal Widget CSS
│   └── client-script.js       # Service Portal Widget AngularJS
└── README.md                  # This file
```

---

## Updating the Tunnel URL

If the Cloudflare tunnel URL changes (restarts), update `01-script-include.js`:

```javascript
this.API_BASE = 'https://new-tunnel-url.trycloudflare.com';
```

---

## Testing

1. Create a test incident with description: "Email not working"
2. Wait 1.5 seconds
3. Verify AI suggestions appear below the field
4. Click "Apply Resolution" and verify fields are populated

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No suggestions appear | Check browser console for errors |
| GlideAjax fails | Verify Script Include is "Client Callable" |
| REST call fails | Verify tunnel URL is correct and backend is running |
| Panel not showing | Ensure Client Script is set to "onChange" on correct field |
