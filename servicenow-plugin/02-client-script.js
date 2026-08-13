/**
 * ============================================================
 * AI Ticket Deflection Listener - Client Script
 * ============================================================
 *
 * ServiceNow Configuration:
 *   Name:            AI Ticket Deflection Listener
 *   Table:           Incident [incident]
 *   UI Type:         All
 *   Type:            onChange
 *   Field name:      Short description
 *   Isolate script:  Unchecked
 *   Global:          Unchecked
 *   Active:          YES
 *
 * Scope:            x_2185757_ai_tic_0
 *   (your instance may generate a different scope)
 *
 * Purpose:          Listens for Short description changes,
 *                   debounces 600ms, then calls GlideAjax
 *                   to fetch AI resolution suggestions.
 *                   Displays result in a GlideModal popup.
 *
 * Flow:
 *   User types in Short description
 *       |  600 ms debounce
 *       v
 *   GlideAjax -> AIDeflectionBroker.getResolution()
 *       |
 *       v
 *   JSON response
 *       |
 *       v
 *   GlideModal -> ai_resolution_popup UI Page
 * ============================================================
 */

function onChange(control, oldValue, newValue, isLoading, isTemplate) {
    if (isLoading || newValue === '') {
        return;
    }

    // Safely clear any existing timer from this form control element directly
    if (control.aiDeflectionTimer) {
        clearTimeout(control.aiDeflectionTimer);
    }

    // Wait 600 milliseconds after typing stops before executing the API broker call
    control.aiDeflectionTimer = setTimeout(function() {
        
        var ga = new GlideAjax('x_2185757_ai_tic_0.AIDeflectionBroker');
        ga.addParam('sysparm_name', 'getResolution');
        ga.addParam('sysparm_title', newValue);
        ga.addParam('sysparm_description', g_form.getValue('description') || '');

        ga.getXMLAnswer(function(response) {
            if (!response) return;
            
            try {
                var data = JSON.parse(response);
                if (data.error) {
                    console.error("AI Deflection Engine Error: ", data.error);
                    return;
                }

                console.log("AI Recommendations Payload Received: ", data);

                // Format your step array items loop cleanly as a multi-line string before handing it off
                var formattedSteps = "";
                if (data.stepByStepInstructions && data.stepByStepInstructions.length > 0) {
                    data.stepByStepInstructions.forEach(function(step, index) {
                        formattedSteps += (index + 1) + ". " + step + "\n";
                    });
                } else {
                    formattedSteps = "No structured manual steps provided.";
                }

                // Initialize the native ServiceNow Draggable Modal Window mapping to your UI Page
                var gm = new GlideModal('x_2185757_ai_tic_0_ai_resolution_popup', false, '500px');
                gm.setTitle('💡 AI Automated Resolution Assistant');
                
                // Securely pass strings down directly into the UI Page layout properties scope
                gm.setPreference('sysparm_summary', String(data.summaryResolution || ''));
                gm.setPreference('sysparm_steps', String(formattedSteps));
                gm.setPreference('sysparm_code', String(data.codeOrCommandSnippet || ''));
                
                // Render the layout frame window - it will instantly display your data!
                gm.render();

            } catch (e) {
                console.error("Failed to map popup preferences safely: ", e);
            }
        });

    }, 600);
}
