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
