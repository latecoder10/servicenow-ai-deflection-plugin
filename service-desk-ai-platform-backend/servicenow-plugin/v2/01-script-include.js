/**
 * ============================================================
 * AI Deflection Engine - Script Include (Server-Side)
 * ============================================================
 * Name          : AIDeflectionEngine
 * API Name      : global.AIDeflectionEngine
 * Client callable: TRUE  ← MUST be checked
 * Accessible from: All application scopes
 * Active        : TRUE
 *
 * BACKEND URL   : https://numerical-else-john-carol.trycloudflare.com
 * ============================================================
 */

var AIDeflectionEngine = Class.create();
AIDeflectionEngine.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /**
     * Called by GlideAjax from the browser.
     * Params:
     *   sysparm_title       - Short description (required)
     *   sysparm_description - Full description (required)
     *   sysparm_category    - Incident category (optional)
     *
     * Returns JSON string of SuggestionResponse or error object.
     */
    getSuggestion: function() {
        var title = this.getParameter('sysparm_title') || '';
        var description = this.getParameter('sysparm_description') || '';
        var category = this.getParameter('sysparm_category') || '';

        // Validate minimum input
        if (!title || title.trim().length < 3) {
            return JSON.stringify({ error: 'title_too_short', deflectionSuccessful: false });
        }
        if (!description || description.trim().length < 5) {
            return JSON.stringify({ error: 'description_too_short', deflectionSuccessful: false });
        }

        try {
            var restMessage = new sn_ws.RESTMessageV2();
            restMessage.setEndpoint('https://numerical-else-john-carol.trycloudflare.com/api/v1/suggestions/resolve');
            restMessage.setHttpMethod('POST');
            restMessage.setRequestHeader('Content-Type', 'application/json');
            restMessage.setRequestHeader('Accept', 'application/json');
            restMessage.setHttpTimeout(15000); // 15s timeout

            var body = {
                title: title.substring(0, 250),
                description: description,
                minConfidenceThreshold: 60
            };

            if (category) {
                body.category = category;
            }

            restMessage.setRequestBody(JSON.stringify(body));

            var response = restMessage.execute();
            var httpStatus = response.getStatusCode();
            var responseBody = response.getBody();

            gs.info('[AIDeflectionEngine] API responded with status: ' + httpStatus + ' for title: ' + title.substring(0, 50));

            if (httpStatus === 200) {
                return responseBody;
            } else if (httpStatus === 400) {
                gs.warn('[AIDeflectionEngine] Bad request (400). Body: ' + responseBody);
                return JSON.stringify({ error: 'bad_request', deflectionSuccessful: false, status: 400 });
            } else if (httpStatus === 503) {
                gs.warn('[AIDeflectionEngine] Backend unavailable (503).');
                return JSON.stringify({ error: 'backend_unavailable', deflectionSuccessful: false, status: 503 });
            } else {
                gs.error('[AIDeflectionEngine] Unexpected status: ' + httpStatus + '. Body: ' + responseBody);
                return JSON.stringify({ error: 'unexpected_status', deflectionSuccessful: false, status: httpStatus });
            }

        } catch (e) {
            gs.error('[AIDeflectionEngine] Exception during getSuggestion: ' + e.getMessage());
            return JSON.stringify({ error: 'exception', message: e.getMessage(), deflectionSuccessful: false });
        }
    },

    type: 'AIDeflectionEngine'
});
