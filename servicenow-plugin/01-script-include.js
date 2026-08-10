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
 * Purpose:              Server-side broker that calls the
 *                       Spring Boot REST API and returns
 *                       the JSON response to the Client Script.
 *
 * Flow:
 *   Client Script
 *       |  GlideAjax
 *       v
 *   AIDeflectionBroker.getResolution()
 *       |  RESTMessageV2
 *       v
 *   Spring Boot POST /api/v1/suggestions/resolve
 *       |
 *       v
 *   JSON response returned to Client Script
 * ============================================================
 */

var AIDeflectionBroker = Class.create();
AIDeflectionBroker.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

    getResolution: function() {
        var title = this.getParameter('sysparm_title');
        var description = this.getParameter('sysparm_description');
        var email = gs.getUser().getEmail() || "anonymous@company.com";

        try {
            var request = new sn_ws.RESTMessageV2(
                'x_2185757_ai_tic_0.Spring Boot Deflection API',
                'resolve'
            );

            request.setStringParameterNoEscape('title', title);
            request.setStringParameterNoEscape('description', description);
            request.setStringParameterNoEscape('callerEmail', email);

            var response = request.execute();
            var responseBody = response.getBody();
            var httpStatus = response.getStatusCode();

            if (httpStatus == 200) {
                return responseBody;
            }

            return JSON.stringify({
                "error": "API returned status code: " + httpStatus
            });

        } catch (ex) {
            return JSON.stringify({
                "error": "System Exception: " + ex.getMessage()
            });
        }
    },

    type: 'AIDeflectionBroker'
});
