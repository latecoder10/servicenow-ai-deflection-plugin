# Setup From Scratch — New ServiceNow Instance

Every click, in order. Verified end to end against a fresh PDI.

| Phase | What | Time |
|---|---|---|
| A | New PDI + OAuth credentials | 10 min |
| B | Point the backend at the new instance | 10 min |
| C | Verify the API + open the tunnel | 10 min |
| D | Build the scoped app in Studio | 25 min |
| E | Test the sidebar | 5 min |

Do them in order. B depends on A, D depends on C.

**Two rules that decide whether this works:**

1. The **OAuth Application Registry** record must be created in **Global** scope. The **app** you build in Studio must be **Scoped**. Opposite requirements, different records.
2. The sidebar renders on the **classic Incident form** only. Formatters do not render in Agent Workspace or Service Operations Workspace. Always reach the form via **All → Incident → Create New**.

---

# PHASE A — Instance and credentials

## A1. Get the instance

1. `https://developer.servicenow.com` → sign in → avatar → **Manage instance**
2. Note the **Instance URL**: `https://devXXXXXX.service-now.com`
3. **Action → Reset/Show password** → note the **admin** password

## A2. Create the OAuth endpoint

> **Set the application picker in the main UI header to `Global` before creating this record.** If it is on a scoped app, the OAuth entity inherits that scope and every token it issues is rejected by the Table API with `403 Access to unscoped api is not allowed` — while still *issuing* the token successfully, so the failure looks like a credentials problem and is not.

1. **All** → `Application Registry` → **New**
2. Choose **Create an OAuth API endpoint for external clients**
3. Fill in:
   - **Name:** `AI Service Desk Backend`
   - **Client ID:** leave auto-generated
   - **Client Secret:** type your own, alphanumeric only — a generated secret containing backticks or `&` causes quoting problems in `.env.local`
   - **Accessible from:** `All application scopes`
4. **Submit**, then reopen and copy the **Client ID** and **Client Secret**

The backend uses the OAuth **password grant** (`ServiceNowOAuth2Client` sends `grant_type=password`), so it needs all four: client id, client secret, admin username, admin password.

---

# PHASE B — Point the backend at the new instance

## B1. Edit the env file

In [.env.local](../service-desk-ai-platform-backend/.env.local), replace only the ServiceNow block:

```env
SERVICENOW_INSTANCE_URL=https://devXXXXXX.service-now.com
SERVICENOW_CLIENT_ID=<from A2>
SERVICENOW_CLIENT_SECRET=<from A2>
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=<from A1>
```

Leave `GEMINI_API_KEY`, `AI_PINECONE_API_KEY`, `AI_PINECONE_HOST` and the Postgres lines alone.

- No trailing slash on the instance URL
- `AI_PINECONE_HOST` has **no** `https://` — the adapter prepends it
- Quote a value only if it contains special characters, and know whether your loader strips the quotes

> Nothing in the repo reads `.env.local` — there is no dotenv dependency and no `spring.config.import`. The variables must reach the JVM as real environment variables (IDE run config, or exported in the shell).

## B2. Start Postgres and the backend

```powershell
cd d:\POC\ai-service-desk-knowledge-intelligence-platform\service-desk-ai-platform-backend
.\setup.bat          # creates the DB if missing, sets Java 21, builds
mvn spring-boot:run
```

Wait for `Started ServiceDeskAiApplication`.

## B3. Gate 1 — prove ServiceNow is reachable

```bash
curl http://localhost:8080/api/v1/servicenow/health
```

Must return `"status":"CONNECTED"`. **Do not continue past this.**

### If it says DISCONNECTED

The endpoint reduces the result to a boolean, so the body never says why. The log does:

```powershell
Select-String -Path logs\service-desk-ai-platform.log -Pattern "ServiceNow OAuth2|Connection validation failed" | Select-Object -Last 10
```

| Log shows | Meaning | Fix |
|---|---|---|
| No `Token acquired` line | Credentials wrong | Client id/secret or admin password |
| `Token acquired` then `403 ... Access to unscoped api is not allowed` | Credentials fine, **OAuth entity is scope-restricted** | See below |

Isolating test — same user, different auth:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -u "admin:<password>" \
  "https://devXXXXXX.service-now.com/api/now/table/core_company?sysparm_limit=1"
```

`200` here plus `403` from the app proves the user and roles are fine and only the OAuth entity is wrong.

**Fix:** open **All → Application Registry → your record**. Add **`Enforce Token Restrictions`** to the form via *Configure → Form Layout* — it is the master switch that makes the other fields bite.

| Field | Should be |
|---|---|
| Application | `Global` |
| Accessible from | `All application scopes` |
| Enforce Token Restrictions | unchecked |
| Scope Restriction | empty |
| Auth Scopes (related list) | empty, or `useraccount` only |

The last four are editable in place — try those first. If **Application** is a scoped app, delete the record, set the picker to **Global**, recreate.

Restart the backend afterwards: the token is cached ~30 minutes with no invalidation endpoint.

> `SERVICENOW_AUTH_MODE` is cosmetic. `ServiceNowConfig` stores it but nothing branches on it — the adapter always sends the OAuth bearer token. There is no basic-auth fallback.

---

# PHASE C — Verify the API and open the tunnel

## C1. Gate 2 — the exact call the sidebar makes

```bash
curl -X POST "http://localhost:8080/api/v1/suggestions/resolve" \
  -H "Content-Type: application/json" \
  -d '{"title":"VPN keeps disconnecting","description":"GlobalProtect drops every 30 minutes","callerEmail":"a@b.com","userDepartment":"IT","category":"Network","minConfidenceThreshold":75}'
```

You need `summaryResolution`, a **multi-item** `stepByStepInstructions`, and `confidenceScore`. **Do not continue past this.**

If `stepByStepInstructions` is the single line *"Review the provided knowledge base context for resolution steps."*, the LLM response was truncated. Check the log for `finishReason=MAX_TOKENS` and confirm `application.yml` has:

```yaml
ai:
  llm:
    max-output-tokens: 2048
    thinking-level: low      # gemini-3.6-flash rejects thinkingBudget with 400
```

Thinking tokens are drawn from `max-output-tokens`; unbounded thinking exhausts the budget before `STEPS:` is written.

## C2. Data

A new PDI has no resolved incidents, but suggestions come from **Pinecone**, not from instance tables — so an existing index works immediately. Only do this if you want a clean rebuild:

```bash
curl -X POST http://localhost:8080/api/v1/knowledge/load-synthetic
curl -X POST http://localhost:8080/api/v1/servicenow/sync/incremental
curl "http://localhost:8080/api/v1/knowledge/search?query=VPN%20disconnecting&topK=3"
```

## C3. Open the tunnel

ServiceNow cannot reach `localhost`. In a **second terminal**, left running:

```bash
lt --port 8080 --subdomain serv-desk-ai
```

Verify from outside:

```bash
curl -H "bypass-tunnel-reminder: 1" https://serv-desk-ai.loca.lt/api/v1/health
```

> The URL changes when you restart `lt`. That is why it lives in a system property, not in code.

---

# PHASE D — Build the scoped app

## D1. Create the app

1. **All** → `Studio`
2. **+ Create** → **On your own** → **Continue**
3. **Name:** `AI Ticket Deflection`
4. **Scope:** leave on **Scoped** (not Global — Scoped is what makes it installable)
5. **Continue**

## D2. Get your scope

`https://devXXXXXX.service-now.com/sys_app_list.do` → find **AI Ticket Deflection** → read the **Scope** column.

It looks like `x_2185757_ai_tic_0`. The digits are your **developer-account** company code, not the instance — a new PDI under the same account reuses the same scope.

If it differs from `x_2185757_ai_tic_0`, rewrite the local files before pasting anything:

```powershell
.\servicenow-plugin\set-scope.ps1 -NewScope x_XXXXXXX_ai_tic_0
```

If it matches, the script prints *"Nothing to do"* and you can skip it.

Every step below writes `<SCOPE>`.

## D3. Five system properties

Studio → **+ Create** → search `System Property` → **Continue**. Repeat five times.

The scoped form has a **Suffix** field and an auto-filled **Name**. **Type the suffix only** — ServiceNow prepends `<SCOPE>.`

| Suffix | Type | Value |
|---|---|---|
| `backend_base_url` | string | `https://serv-desk-ai.loca.lt` |
| `resolve_path` | string | `/api/v1/suggestions/resolve` |
| `min_confidence` | integer | `75` |
| `http_timeout_ms` | integer | `12000` |
| `enabled` | true \| false | `true` |

- Pasting the full dotted name yields `<SCOPE>.<SCOPE>.backend_base_url`
- **No trailing slash** on `backend_base_url`
- Leave **Ignore cache** unchecked; leave Choices, Description and both role fields blank

> A red `putRow() must be called for catalog [Default Builder]...` banner is Studio cache noise. Ignore it unless Submit actually fails.

## D4. The logging table

Studio → **+ Create** → search `Table` → **Create a blank table** → **Continue**

1. **Table label:** `Deflection Log`
2. **Table name:** `deflection_log` — the prefix `<SCOPE>_` is fixed and shown beside it
3. Leave **Make extensible** and **Auto number** unchecked → **Continue**
4. Permissions screen — tick and **Continue**:

| Role | Check |
|---|---|
| `<SCOPE>.admin` | **All** |
| `<SCOPE>.user` | **Create** and **Read** |

Continue stays greyed out until something is ticked. The `.user` **Create** box matters: when a non-admin clicks "This solved it" the insert runs as *that* user, so without it logging silently fails for everyone except admins.

5. On the **Table fields** grid, **+ Add new field** six times. Type the **Column name** directly:

| Column label | Column name | Type | Reference | Max length |
|---|---|---|---|---|
| User | `u_user` | Reference | User [sys_user] | — |
| Input Text | `u_input_text` | String | — | 4000 |
| Suggestion Id | `u_suggestion_id` | String | — | 100 |
| Correlation Id | `u_correlation_id` | String | — | 100 |
| Confidence | `u_confidence` | String | — | 40 |
| Action Taken | `u_action_taken` | String | — | 40 |

6. **Save**

If your instance generates different column names, change the matching `setValue('u_...')` lines in [01-script-include.js](01-script-include.js). The broker calls `isValid()` first, so a mismatch logs a warning rather than breaking the sidebar.

## D5. The Script Include

Studio → **+ Create** → search `Script Include` → **Continue**

1. **Name:** `AIDeflectionBroker` — case-sensitive
2. **Glide AJAX enabled:** checked
3. **Accessible from:** `All application scopes`
4. **Active:** checked
5. **Caller Access:** `-- None --`
6. **Protection policy:** `-- None --` — Read only / Protected would lock the source and stop you editing it
7. Leave the **ECMAScript 2021 (ES12)** toggle **off** — the script is ES5
8. Paste all of [01-script-include.js](01-script-include.js), ending with `type: 'AIDeflectionBroker'` and `});`
9. **Submit**

A dialog appears: *"Select a user role for Access Control on this Client Callable Script Include"*. It will not let you submit without an answer.

- Pick **`itil`**. Agents and admins pass, which covers the demo.
- `snc_internal` does not exist unless the Explicit Roles plugin is active.
- To open it to self-service users later: **All → System Security → Access Control (ACL)**, filter type `Client Callable Script Include`, find `AIDeflectionBroker`, clear the role or add a second ACL.

## D6. The UI Macro

Studio → **+ Create** → search `Macro` → pick **Macro** (`sys_ui_macro`) — this Studio does not list it as "UI Macro"

1. **Name:** `ai_deflection_sidebar`
2. **Active:** checked
3. Paste all of [02-ui-macro-sidebar.xml](02-ui-macro-sidebar.xml)
4. **Submit**
5. **Copy the API Name field** — `<SCOPE>_ai_deflection_sidebar`. That prefixed value, not the plain Name, is what D7 needs.

> ### Paste the file exactly. Do not "tidy" it.
>
> ServiceNow parses a UI macro as XML, **ignores CDATA**, and then **re-parses the decoded result**. Neither raw characters nor XML entities survive that:
>
> - a raw `&` fails the first pass → `The entity name must immediately follow the '&' in the entity reference.`
> - an escaped `&amp;middot;` decodes to `&middot;` and fails the second pass → `The entity "middot" was referenced, but not declared.`
>
> Either error takes down the **entire Incident form** — you get a bare parser message instead of the record.
>
> So the script contains **no ampersand and no left angle bracket at all**: DOM is built with `createElement`/`appendChild` instead of `innerHTML`, text is assigned with `textContent` instead of manual escaping, comparisons put the larger value on the left, and logical AND is written as nested `if`s. There is deliberately no CDATA block.
>
> **If the form ever locks up:** open the **AI Deflection Sidebar** UI Formatter and uncheck **Active**. The form loads again immediately and you can fix the macro without being locked out of the instance.

## D7. The UI Formatter

Studio → **+ Create** → search `Formatter` → pick **UI Formatter** (`sys_ui_formatter`)

- **Name:** `AI Deflection Sidebar`
- **Formatter:** the **API Name** from D6 — `<SCOPE>_ai_deflection_sidebar`, no `.xml`
- **Table:** `Incident [incident]`
- **Type:** `Formatter`
- **Seismic Component:** blank

**Submit.** Accept the cross-scope privilege prompt if one appears.

## D8. Put it on the Incident form

1. Leave Studio. **All** → `Incident` → **Create New**
2. Right-click the form header → **Configure → Form Layout**
3. A banner says the Incident section is in **Global** but your app is current. Click **Edit this section in Global**.
   - Not "Create a section" — the macro renders no inline content, so you would get a visibly empty section
   - Not "Create a view" — that makes a separate form view you would have to switch into
4. Select **AI Deflection Sidebar** in **Available** → **>** → move to **top** of **Selected**
5. **Save**

> This form-layout record lives in **Global**, so it does not travel inside the app. Packaging for another instance means shipping it in an update set or redoing D8 by hand. Everything else — properties, table, script include, macro, formatter — is inside the app.

## D9. Clear the cache

1. `https://devXXXXXX.service-now.com/cache.do`
2. **Ctrl + Shift + R**

Do this after every macro edit. Macros cache hard.

---

# PHASE E — Test

1. **All → Incident → Create New** (classic form, not Workspace)
2. Click into **Short description**
3. Type `VPN keeps disconnecting every 30 minutes` and stop

Expected, in order:

1. ~700 ms pause
2. Right panel shows a spinner — *"Searching past incidents and knowledge..."*
3. Panel fills: confidence badge, recommended title, summary, numbered steps, copyable command, and a **Based on** list citing the records the answer came from
4. Footer shows **This solved it** / **Still need help - continue**

Click **This solved it** → panel turns green. Confirm the log row: **All** → `Deflection Log` → one record with your text and `resolved`.

> `confidenceScore` around 64 is below the default `min_confidence` of 75, so the panel footer adds *"below deflection threshold - review before relying on this"*. That is accurate, not a bug. To drop the caveat for a demo, set the `min_confidence` property to `60`. It is a property edit, not a code change.

---

# Troubleshooting

Cheapest checks first.

| Symptom | Cause | Fix |
|---|---|---|
| Incident form shows only a parser error | Raw `&` or `<` in the macro | Uncheck **Active** on the UI Formatter to get the form back, then re-paste the macro unmodified |
| No panel at all | Formatter not on the layout | Redo D8 |
| No panel, layout is right | Cache | Redo D9 |
| No panel, form opened in Workspace | Formatters don't render there | **All → Incident → Create New** |
| Panel says `BACKEND_URL_NOT_SET` | Property missing or wrong scope prefix | Redo D3 |
| Panel says `NON_JSON_RESPONSE` | Tunnel down or serving its interstitial | Restart `lt`, update the property, re-run C3 |
| Panel says `HTTP_0` or `EXCEPTION` | Instance can't reach the tunnel | Open the tunnel URL in your own browser |
| Panel says `HTTP_400` | Backend rejected the payload | Read `details` in the message; re-run C1 |
| Panel says `HTTP_500` | Backend threw | Check the `mvn spring-boot:run` terminal |
| Spinner never resolves | GlideAjax scope mismatch | F12 console — `GlideAjax('<SCOPE>.AIDeflectionBroker')` must match D2 |
| Panel works, "This solved it" logs nothing | Column names differ, or `.user` lacks Create | Compare D4 against the `setValue` lines |
| Steps show one placeholder line | LLM truncated | See C1 — `thinking-level: low` |

## Every time you restart the tunnel

1. **All** → `sys_properties.list`
2. Search `backend_base_url`
3. Update the value

No cache clear needed — the Script Include reads it per request.

---

# What you end up with

```
Incident form (classic UI)
   |
   |  UI Formatter "AI Deflection Sidebar"
   v
Macro ai_deflection_sidebar           <- DOM sidebar, 700ms debounce
   |
   |  GlideAjax
   v
Script Include AIDeflectionBroker     <- reads system properties
   |
   |  RESTMessageV2 POST
   v
https://<tunnel>/api/v1/suggestions/resolve
   |
   v
Spring Boot -> Gemini + Pinecone -> SuggestionResponse
   |
   v
Sidebar renders summary + steps + command + confidence
   |
   |  "This solved it"
   v
<SCOPE>_deflection_log
```
