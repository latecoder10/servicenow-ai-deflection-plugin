/**
 * ============================================================
 * AI Deflection Engine - Script Include (Server-Side)
 * ============================================================
 *
 * ServiceNow Configuration:
 *   Name:                AIDeflectionBroker
 *   Client Callable:     Yes (Glide AJAX enabled)
 *   Accessible from:     All application scopes
 *   Active:              TRUE
 *
 * Scope:                x_2185757_ai_tic_0
 *   (your instance may generate a different scope)
 *
 * Purpose:              Server-side broker between the Incident form
 *                       sidebar (UI Macro) and the Spring Boot REST API.
 *
 * Flow:
 *   UI Macro sidebar
 *       |  GlideAjax
 *       v
 *   AIDeflectionBroker.getResolution()
 *       |  RESTMessageV2
 *       v
 *   Spring Boot POST /api/v1/suggestions/resolve
 *       |
 *       v
 *   JSON response returned to the sidebar
 *
 * System properties this reads (create them, see INSTALL-SIDEBAR.md):
 *   x_2185757_ai_tic_0.backend_base_url   e.g. https://serv-desk-ai.loca.lt
 *   x_2185757_ai_tic_0.resolve_path       /api/v1/suggestions/resolve
 *   x_2185757_ai_tic_0.min_confidence     75
 *   x_2185757_ai_tic_0.http_timeout_ms    25000   (resolve call)
 *   x_2185757_ai_tic_0.status_timeout_ms  12000   (connector status pill, optional)
 *   x_2185757_ai_tic_0.enabled            true
 * ============================================================
 */

var AIDeflectionBroker = Class.create();
AIDeflectionBroker.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

    SCOPE: 'x_2185757_ai_tic_0',
    LOG_TABLE: 'x_2185757_ai_tic_0_deflection_log',

    // ---- entry point used by the sidebar UI Macro ---------------------------
    getResolution: function () {
        if (gs.getProperty(this.SCOPE + '.enabled', 'true') != 'true') {
            return JSON.stringify({ error: 'DISABLED', message: 'AI deflection is turned off.' });
        }

        var title = String(this.getParameter('sysparm_title') || '').trim();
        var description = String(this.getParameter('sysparm_description') || '').trim();

        // Backend validation: title 3-250 chars, description NotBlank
        if (title.length < 3) {
            return JSON.stringify({ error: 'TITLE_TOO_SHORT', message: 'Keep typing a short description.' });
        }
        if (title.length > 250) {
            title = title.substring(0, 250);
        }
        if (!description) {
            description = title;
        }

        var base = String(gs.getProperty(this.SCOPE + '.backend_base_url', '')).replace(/\/+$/, '');
        if (!base) {
            return JSON.stringify({
                error: 'BACKEND_URL_NOT_SET',
                message: 'Set the system property ' + this.SCOPE + '.backend_base_url'
            });
        }

        var path = String(gs.getProperty(this.SCOPE + '.resolve_path', '/api/v1/suggestions/resolve'));
        var timeout = parseInt(gs.getProperty(this.SCOPE + '.http_timeout_ms', '12000'), 10) || 12000;

        // minConfidenceThreshold is an int (0-100) on the backend record, NOT a decimal
        var threshold = parseInt(gs.getProperty(this.SCOPE + '.min_confidence', '75'), 10);
        if (isNaN(threshold) || threshold <= 0) {
            threshold = 75;
        }

        // Absent means include, matching the backend default. Only an explicit
        // "false" from the sidebar switch turns Drive results off.
        var includeDrive = String(this.getParameter('sysparm_include_drive') || 'true') !== 'false';

        var payload = {
            title: title,
            description: description,
            callerEmail: this._callerEmail(),
            userDepartment: this._department(),
            // Blank, not a guess. This becomes a Pinecone metadata filter, and the
            // sidebar fires before the agent has picked a category, so a hardcoded
            // "Software" matched no indexed record and forced the backend into a
            // second, unfiltered query on every keystroke. Blank skips the filter.
            category: String(this.getParameter('sysparm_category') || ''),
            minConfidenceThreshold: threshold,
            includeDriveResults: includeDrive
        };

        try {
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint(base + path);
            request.setHttpMethod('POST');
            request.setRequestHeader('Content-Type', 'application/json');
            request.setRequestHeader('Accept', 'application/json');
            // LocalTunnel serves an HTML interstitial without this header
            request.setRequestHeader('bypass-tunnel-reminder', 'servicenow');
            request.setRequestHeader('User-Agent', 'ServiceNow-AIDeflectionBroker/1.0');
            request.setHttpTimeout(timeout);
            request.setRequestBody(JSON.stringify(payload));

            var response = request.execute();
            var status = parseInt(response.getStatusCode(), 10);
            var body = String(response.getBody() || '');

            if (status === 200) {
                // Guard against a tunnel/proxy returning HTML with a 200
                if (body.indexOf('{') !== 0) {
                    return JSON.stringify({
                        error: 'NON_JSON_RESPONSE',
                        message: 'Backend returned non-JSON (tunnel interstitial?).',
                        details: body.substring(0, 300)
                    });
                }
                return body;
            }

            gs.warn('[AIDeflectionBroker] HTTP ' + status + ' from ' + base + path + ' :: ' + body);
            return JSON.stringify({
                error: 'HTTP_' + status,
                message: 'Backend returned status ' + status,
                details: body.substring(0, 500)
            });

        } catch (ex) {
            gs.error('[AIDeflectionBroker] ' + ex);
            return JSON.stringify({ error: 'EXCEPTION', message: String(ex) });
        }
    },

    // ---- connector reachability, for the sidebar status indicator -----------
    getConnectorStatus: function () {
        var base = String(gs.getProperty(this.SCOPE + '.backend_base_url', '')).replace(/\/+$/, '');
        if (!base) {
            return JSON.stringify({ connectors: {} });
        }

        try {
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint(base + '/api/v1/connectors/status');
            request.setHttpMethod('GET');
            request.setRequestHeader('Accept', 'application/json');
            request.setRequestHeader('bypass-tunnel-reminder', 'servicenow');
            // Matches the header getResolution sends. Without it a tunnel can decide
            // this is a browser and answer with its interstitial instead of JSON.
            request.setRequestHeader('User-Agent', 'ServiceNow-AIDeflectionBroker/1.0');
            // Still shorter than the resolve timeout - this only drives a status pill
            // and must not hold up the panel - but not 5s. On a cache miss the backend
            // makes a live Google API call, which measured 3.1s through the tunnel from
            // a local machine and more from an instance, so 5s failed almost every cold
            // check and the pill was permanently stuck reporting an unknown source.
            request.setHttpTimeout(
                parseInt(gs.getProperty(this.SCOPE + '.status_timeout_ms', '12000'), 10) || 12000);

            var response = request.execute();
            var status = parseInt(response.getStatusCode(), 10);
            var body = String(response.getBody() || '');
            if (status === 200 && body.indexOf('{') === 0) {
                return body;
            }
            // Previously a non-200 fell through silently, so a failing status check was
            // indistinguishable from a disconnected connector anywhere in the logs.
            gs.warn('[AIDeflectionBroker] Connector status HTTP ' + status + ' :: '
                + body.substring(0, 200));
        } catch (ex) {
            gs.warn('[AIDeflectionBroker] Connector status unavailable: ' + ex);
        }
        return JSON.stringify({ connectors: {} });
    },

    // ---- feedback / analytics logging --------------------------------------
    logDeflection: function () {
        // Report the outcome to the platform as well as the local table. The local row
        // is the ServiceNow-side audit trail; the platform needs it to compute a real
        // deflection rate rather than counting suggestions it merely offered.
        this._reportOutcomeToBackend(
            String(this.getParameter('sysparm_suggestion_id') || ''),
            String(this.getParameter('sysparm_action') || '')
        );

        try {
            var log = new GlideRecord(this.LOG_TABLE);
            if (!log.isValid()) {
                gs.warn('[AIDeflectionBroker] log table missing: ' + this.LOG_TABLE);
                return 'no-table';
            }
            log.initialize();
            log.setValue('u_user', gs.getUserID());
            log.setValue('u_input_text', String(this.getParameter('sysparm_dfl_text') || '').substring(0, 4000));
            log.setValue('u_suggestion_id', String(this.getParameter('sysparm_suggestion_id') || ''));
            log.setValue('u_correlation_id', String(this.getParameter('sysparm_correlation_id') || ''));
            log.setValue('u_confidence', String(this.getParameter('sysparm_score') || '0'));
            log.setValue('u_action_taken', String(this.getParameter('sysparm_action') || ''));
            log.insert();
            return 'ok';
        } catch (ex) {
            gs.error('[AIDeflectionBroker.logDeflection] ' + ex);
            return 'error';
        }
    },

    // ---- helpers -----------------------------------------------------------

    /**
     * Tells the platform what the agent decided. Best effort: the sidebar has already
     * done its job by this point, so a reporting failure must not surface to the user.
     */
    _reportOutcomeToBackend: function (suggestionId, action) {
        if (!suggestionId) {
            return;   // nothing was suggested, so there is no outcome to attach
        }

        var outcome = (action === 'resolved') ? 'SOLVED' : 'CONTINUED';
        var base = String(gs.getProperty(this.SCOPE + '.backend_base_url', '')).replace(/\/+$/, '');
        if (!base) {
            return;
        }

        try {
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint(base + '/api/v1/suggestions/'
                + encodeURIComponent(suggestionId) + '/feedback?outcome=' + outcome);
            request.setHttpMethod('POST');
            request.setRequestHeader('Accept', 'application/json');
            request.setRequestHeader('bypass-tunnel-reminder', 'servicenow');
            request.setHttpTimeout(5000);
            request.execute();
        } catch (ex) {
            gs.warn('[AIDeflectionBroker] Could not report outcome for ' + suggestionId + ': ' + ex);
        }
    },

    _callerEmail: function () {
        var email = '';
        try {
            email = String(gs.getUser().getEmail() || '');
        } catch (e) {
            email = '';
        }
        return email || 'anonymous@company.com';
    },

    _department: function () {
        var dept = String(this.getParameter('sysparm_department') || '');
        if (dept) {
            return dept;
        }
        try {
            var user = new GlideRecord('sys_user');
            if (user.get(gs.getUserID())) {
                dept = String(user.getDisplayValue('department') || '');
            }
        } catch (e) {
            dept = '';
        }
        // Blank rather than "IT Department": the indexed departments are exactly
        // "Global Service Desk", "IT" and "Knowledge Management", so that fallback
        // matched nothing and only cost an extra round trip.
        return dept || '';
    },

    type: 'AIDeflectionBroker'
});
