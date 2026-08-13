# AI Deflection Sidebar — Install Steps

Scoped application: **AI Ticket Deflection** (`x_2185757_ai_tic_0`)
If your instance generated a different scope prefix, replace `x_2185757_ai_tic_0` everywhere below **and** in the two script files.

Result: a fixed panel on the right of the Incident form that calls the Spring Boot backend as the user types and shows the AI resolution before the ticket is submitted.

---

## Why this replaces the popup approach

The old flow was `onChange` Client Script → `GlideModal` → UI Page. Two problems:

1. **A modal interrupts typing.** The sidebar sits alongside the form instead.
2. **A scoped client script cannot build a sidebar.** The "Isolate script" checkbox exists only in Global scope — client scripts in a scoped app are always isolated, so `document.body.appendChild(...)` is unavailable. A **UI Macro** rendered by a **Formatter** runs in the real form window and has full DOM access. That is what the sidebar uses.

Files in this folder:

| File | Goes to |
|---|---|
| `01-script-include.js` | Script Include `AIDeflectionBroker` |
| `02-ui-macro-sidebar.xml` | UI Macro `ai_deflection_sidebar` |
| `02-client-script.js` | **legacy** — deactivate, see Step 8 |
| `04-ui-page.html` | **legacy** — the modal, no longer used |

---

## Step 1 — Backend must be reachable

Run the backend and expose it:

```powershell
cd service-desk-ai-platform-backend
mvn spring-boot:run
lt --port 8080 --subdomain serv-desk-ai
```

Verify the exact contract the sidebar depends on:

```powershell
curl -X POST https://serv-desk-ai.loca.lt/api/v1/suggestions/resolve `
  -H "Content-Type: application/json" `
  -H "bypass-tunnel-reminder: 1" `
  -d '{\"title\":\"VPN keeps disconnecting\",\"description\":\"GlobalProtect drops every 30 minutes\",\"callerEmail\":\"a@b.com\",\"userDepartment\":\"IT\",\"category\":\"Network\",\"minConfidenceThreshold\":75}'
```

You must get JSON containing `summaryResolution`, `stepByStepInstructions`, `confidenceScore`. If you get an HTML page instead, LocalTunnel's interstitial is in the way — the broker already sends the `bypass-tunnel-reminder` header to avoid it.

> `minConfidenceThreshold` is an **int 0–100** on the backend (`ResolveIncidentRequest`), not a decimal. The old script sent `0.70`, which Jackson coerced to `0` and the record then defaulted to `75`. It worked by accident; it now sends `75` explicitly.

---

## Step 2 — System properties

Studio → **Create Application File → System Definition → System Property** — create five, all in the app scope:

| Name | Type | Value |
|---|---|---|
| `x_2185757_ai_tic_0.backend_base_url` | string | `https://serv-desk-ai.loca.lt` (no trailing slash) |
| `x_2185757_ai_tic_0.resolve_path` | string | `/api/v1/suggestions/resolve` |
| `x_2185757_ai_tic_0.min_confidence` | integer | `75` |
| `x_2185757_ai_tic_0.http_timeout_ms` | integer | `12000` |
| `x_2185757_ai_tic_0.enabled` | true/false | `true` |

This is the one change that saves you the most time: your tunnel URL changes on every restart, and now you edit a property instead of the Script Include.

---

## Step 3 — Logging table

Studio → **Create Application File → Data Model → Table**

- Label: `Deflection Log`
- Name: `x_2185757_ai_tic_0_deflection_log`
- Create module / application menu: optional

Add these columns (set the **Column name** exactly as shown — ServiceNow prefills a `u_` prefix, keep it):

| Column name | Type | Max length |
|---|---|---|
| `u_user` | Reference → `sys_user` | — |
| `u_input_text` | String | 4000 |
| `u_suggestion_id` | String | 100 |
| `u_correlation_id` | String | 100 |
| `u_confidence` | String | 40 |
| `u_action_taken` | String | 40 |

If your instance names a column differently, fix the matching `setValue(...)` line in `01-script-include.js`. The broker checks `isValid()` first, so a missing table degrades to a warning in the log rather than breaking the sidebar.

---

## Step 4 — Script Include

Studio → **Create Application File → Server Development → Script Include**

- Name: `AIDeflectionBroker`
- Client callable: **checked**
- Accessible from: **All application scopes**
- Active: checked
- Script: paste all of [01-script-include.js](01-script-include.js)

---

## Step 5 — UI Macro

Studio → **Create Application File → Forms & UI → UI Macro**

- Name: `ai_deflection_sidebar`
- Active: checked
- XML: paste all of [02-ui-macro-sidebar.xml](02-ui-macro-sidebar.xml)

Keep the `<![CDATA[ ... ]]>` wrapper around the `<script>` body. Without it Jelly chokes on `&&` and `<` inside the JavaScript.

---

## Step 6 — Formatter

Studio → **Create Application File → Forms & UI → Formatter**

- Name: `AI Deflection Sidebar`
- Formatter: `ai_deflection_sidebar` — the UI Macro name, no `.xml`
- Table: `Incident [incident]`
- Type: `Formatter`

Incident is a global table, so ServiceNow may prompt to record a cross-scope privilege. Accept it.

---

## Step 7 — Put the formatter on the Incident form

1. Open any Incident → right-click header → **Configure → Form Layout**
2. Find `AI Deflection Sidebar` in **Available** → move to **Selected**
3. Position it at the **top** of the form (it renders no inline content, but running early means the panel appears sooner)
4. Save

---

## Step 8 — Retire the popup

The old modal and the sidebar both firing means two things pop at once.

1. **System Definition → Client Scripts** → `AI Ticket Deflection Listener` → uncheck **Active** → Update
2. UI Page `ai_resolution_popup` can stay; nothing calls it once the client script is off

---

## Step 9 — Test

1. `cache.do` in the instance URL bar (UI Macro changes are cached hard)
2. Hard-refresh the browser: `Ctrl+Shift+R`
3. **Incident → New**
4. Type into Short description: `VPN keeps disconnecting every 30 minutes`

Expected: after ~700 ms of no typing, the right panel shows a spinner, then the confidence badge, recommended title, summary, numbered steps, and a copyable command.

---

## Tuning

Top of the `<script>` block in the UI Macro:

| Constant | Default | Meaning |
|---|---|---|
| `ONLY_NEW_RECORD` | `true` | `false` also runs the panel on saved incidents |
| `MIN_CHARS` | `15` | Combined short+description length before calling the backend |
| `DEBOUNCE_MS` | `700` | Idle time after the last keystroke |
| `SIDEBAR_W` | `360` | Panel width in px |
| `MIN_WINDOW_W` | `1000` | Below this viewport width the panel is suppressed |
| `PUSH_FORM` | `true` | Pads the form so the panel never overlaps fields |

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| No panel at all | Formatter not on the form layout, or `cache.do` not run. Check the browser console for `AIDeflectionBroker` errors. |
| `BACKEND_URL_NOT_SET` in the panel | Step 2 property missing or in the wrong scope. |
| `NON_JSON_RESPONSE` | Tunnel is serving its interstitial or is down. Re-run the Step 1 curl. |
| `HTTP_400` | Title under 3 chars or blank description reaching the backend. The broker copies title→description when description is empty, so this usually means the backend rejected something else — check `details` in the panel message. |
| `HTTP_0` / `EXCEPTION` | Instance cannot reach the tunnel. A PDI has outbound HTTP; a corporate instance may need the domain allowlisted. |
| Panel appears but overlaps fields | Set `PUSH_FORM = true` (default) or reduce `SIDEBAR_W`. |
| Nothing logs on "This solved it" | Step 3 table name or column names differ. Check the system log for `log table missing`. |

---

## One-suggestion vs many

Your friend's script rendered N collapsible cards because it scored many past incidents locally with a Dice coefficient. Your backend returns **one** AI-generated resolution (`SuggestionResponse` is a single record, not a list), so the panel renders one rich card instead — summary, steps, snippet, confidence band, source count.

If you later want a ranked list in the panel, the backend change is `SuggestionController.resolveIncident` returning `List<SuggestionResponse>`; the panel's `render()` is the only client-side function that would need to loop.
