var AIServiceDeskClient = Class.create();
AIServiceDeskClient.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    getSuggestions: function() {
        var description = this.getParameter('sysparm_description');
        var category = this.getParameter('sysparm_category') || '';

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
            if (category) body.category = category;

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

    searchKnowledge: function() {
        var query = this.getParameter('sysparm_query');
        var topK = this.getParameter('sysparm_topK') || '5';

        if (!query || query.trim().length === 0) {
            return JSON.stringify({ results: [] });
        }

        try {
            var url = 'https://sciences-tap-museum-insulation.trycloudflare.com/api/v1/knowledge/search?query=' + encodeURIComponent(query) + '&topK=' + topK;
            var restMessage = new sn_ws.RESTMessageV2();
            restMessage.setEndpoint(url);
            restMessage.setHttpMethod('GET');
            restMessage.setRequestHeader('Content-Type', 'application/json');
            restMessage.setHttpTimeout(10000);

            var response = restMessage.execute();
            var httpStatus = response.getStatusCode();

            if (httpStatus === 200) {
                return response.getBody();
            } else {
                return JSON.stringify({ results: [], error: 'API status ' + httpStatus });
            }
        } catch (e) {
            gs.error('[AI Service Desk] searchKnowledge failed: ' + e.getMessage());
            return JSON.stringify({ results: [], error: e.getMessage() });
        }
    },

    type: 'AIServiceDeskClient'
});
