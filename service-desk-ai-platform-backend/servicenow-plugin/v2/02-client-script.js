/**
 * AI Deflection - Show Suggestions on New Incident
 * Table: Incident [incident]
 * Type: onChange
 * Field name: short_description
 * UI Type: All
 * Active: YES | Global: YES | Isolate script: NO (unchecked)
 */

function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading || isLoading === undefined) return;

    if (!newValue || newValue.trim().length === 0) {
        aiHidePanel();
        return;
    }

    if (newValue.trim().length < 15) {
        return;
    }

    var store = aiGetStore();
    if (store._timer) {
        clearTimeout(store._timer);
        store._timer = null;
    }

    store._timer = setTimeout(function () {
        aiTriggerSearch(newValue);
    }, 2000);
}

function aiGetStore() {
    var el = document.getElementById('ai-defl-store');
    if (!el) {
        el = document.createElement('span');
        el.id = 'ai-defl-store';
        el.style.display = 'none';
        document.body.appendChild(el);
    }
    return el;
}

function aiTriggerSearch(shortDesc) {
    try {
        var desc = g_form.getValue('description') || '';
        var combined = desc.trim().length > 0 ? desc : shortDesc;

        var store = aiGetStore();
        var cacheKey = shortDesc + '::' + combined.substring(0, 50);
        if (store._lastQuery === cacheKey) return;
        store._lastQuery = cacheKey;

        aiShowLoading();

        var ga = new GlideAjax('AIDeflectionEngine');
        ga.addParam('sysparm_name', 'getSuggestion');
        ga.addParam('sysparm_title', shortDesc);
        ga.addParam('sysparm_description', combined);
        ga.addParam('sysparm_category', g_form.getValue('category') || '');
        ga.getXMLAnswer(function (resp) {
            try {
                var result = JSON.parse(resp);
                aiRenderResult(result);
            } catch (e) {
                aiShowError('Could not parse AI response');
            }
        });
    } catch (err) {
        aiShowError('Failed to call AI engine: ' + err);
    }
}

function aiShowLoading() {
    var panel = aiGetOrCreatePanel();
    panel.style.display = 'block';
    var deg = 0;
    panel.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;">' +
        '<div id="ai-spinner" style="width:18px;height:18px;border:3px solid #c7d2fe;border-top-color:#6366f1;border-radius:50%;flex-shrink:0;"></div>' +
        '<div>' +
        '<div style="font-weight:700;color:#1e1b4b;font-size:13px;">AI is searching the knowledge base...</div>' +
        '<div style="color:#6b7280;font-size:12px;margin-top:2px;">This takes 1-3 seconds</div>' +
        '</div></div>';
    var spinInterval = setInterval(function () {
        var sp = document.getElementById('ai-spinner');
        if (!sp) { clearInterval(spinInterval); return; }
        deg = (deg + 30) % 360;
        sp.style.transform = 'rotate(' + deg + 'deg)';
    }, 80);
    aiGetStore()._spinInterval = spinInterval;
}

function aiShowError(msg) {
    aiStopSpinner();
    var panel = aiGetOrCreatePanel();
    panel.style.display = 'block';
    panel.innerHTML =
        '<div style="padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="color:#dc2626;font-size:13px;font-weight:600;">Could not reach AI backend: ' + msg + '</div>' +
        '<button onclick="aiHidePanel()" style="' + aiBtnCss('#6b7280') + '">Dismiss</button>' +
        '</div>';
}

function aiHidePanel() {
    var panel = document.getElementById('ai-defl-panel');
    if (panel) panel.style.display = 'none';
    var store = aiGetStore();
    store._lastQuery = null;
    aiStopSpinner();
}

function aiStopSpinner() {
    var store = aiGetStore();
    if (store._spinInterval) {
        clearInterval(store._spinInterval);
        store._spinInterval = null;
    }
}

function aiRenderResult(data) {
    aiStopSpinner();
    var panel = aiGetOrCreatePanel();
    panel.style.display = 'block';

    if (!data || data.error) {
        panel.innerHTML =
            '<div style="padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">' +
            '<div style="color:#d97706;font-size:13px;">No matching resolutions found in knowledge base.</div>' +
            '<button onclick="aiHidePanel()" style="' + aiBtnCss('#6b7280') + '">OK</button>' +
            '</div>';
        return;
    }

    if (!data.deflectionSuccessful) {
        var sc = data.confidenceScore || 0;
        panel.innerHTML =
            '<div style="padding:12px 18px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<span style="color:#d97706;font-weight:700;font-size:13px;">Possible match found (low confidence)</span>' +
            '<span style="background:#fef3c7;color:#d97706;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">' + sc + '% - ' + (data.confidenceBand || 'LOW') + '</span>' +
            '</div>' +
            (data.summaryResolution ? '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;font-size:12px;color:#92400e;margin-bottom:10px;">' + aiEsc(data.summaryResolution).substring(0, 200) + '...</div>' : '') +
            '<button onclick="aiHidePanel()" style="' + aiBtnCss('#6b7280') + '">Dismiss</button>' +
            '</div>';
        return;
    }

    var score = data.confidenceScore || 0;
    var band = data.confidenceBand || '';
    var scoreColor = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
    var scoreBg = score >= 80 ? '#d1fae5' : score >= 60 ? '#fef3c7' : '#fee2e2';

    var html = '';

    html += '<div style="padding:12px 18px 10px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-size:20px;">&#10024;</span>';
    html += '<div><div style="font-weight:700;color:#1e1b4b;font-size:14px;">AI Resolution Found!</div>';
    html += '<div style="color:#6b7280;font-size:11px;">From resolved incidents in knowledge base</div></div>';
    html += '</div>';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span style="background:' + scoreBg + ';color:' + scoreColor + ';padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">' + score + '% - ' + band + '</span>';
    html += '<button onclick="aiHidePanel()" style="background:none;border:none;cursor:pointer;color:#9ca3af;font-size:22px;line-height:1;padding:2px 6px;">&times;</button>';
    html += '</div></div>';

    if (data.recommendedTitle) {
        html += '<div style="padding:10px 18px 0;">';
        html += '<div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Best Match</div>';
        html += '<div style="font-weight:600;color:#374151;font-size:13px;">' + aiEsc(data.recommendedTitle) + '</div>';
        html += '</div>';
    }

    if (data.summaryResolution) {
        html += '<div style="padding:10px 18px 0;">';
        html += '<div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Summary</div>';
        html += '<div style="background:#f9fafb;border-radius:6px;padding:10px 12px;font-size:13px;color:#374151;line-height:1.6;">' + aiEsc(data.summaryResolution) + '</div>';
        html += '</div>';
    }

    if (data.stepByStepInstructions && data.stepByStepInstructions.length > 0) {
        html += '<div style="padding:10px 18px 0;">';
        html += '<div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">Step-by-Step Resolution</div>';
        html += '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:10px 12px;">';
        for (var i = 0; i < data.stepByStepInstructions.length; i++) {
            html += '<div style="display:flex;gap:10px;margin-bottom:' + (i < data.stepByStepInstructions.length - 1 ? '8' : '0') + 'px;">';
            html += '<span style="background:#0ea5e9;color:white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;line-height:20px;text-align:center;">' + (i + 1) + '</span>';
            html += '<span style="font-size:13px;color:#0c4a6e;line-height:1.5;padding-top:1px;">' + aiEsc(data.stepByStepInstructions[i]) + '</span>';
            html += '</div>';
        }
        html += '</div></div>';
    }

    if (data.codeOrCommandSnippet) {
        html += '<div style="padding:10px 18px 0;">';
        html += '<div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Command / Script</div>';
        html += '<div style="background:#1e1b4b;color:#a5b4fc;font-size:12px;padding:10px 12px;border-radius:6px;font-family:monospace;white-space:pre-wrap;line-height:1.5;">' + aiEsc(data.codeOrCommandSnippet) + '</div>';
        html += '</div>';
    }

    if (data.sourcesCount && data.sourcesCount > 0) {
        html += '<div style="padding:8px 18px 0;display:flex;gap:8px;flex-wrap:wrap;">';
        html += '<span style="background:#ede9fe;color:#7c3aed;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">Sources: ' + data.sourcesCount + '</span>';
        if (data.generatedByModel) {
            html += '<span style="background:#e0f2fe;color:#0369a1;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">Model: ' + aiEsc(data.generatedByModel) + '</span>';
        }
        html += '</div>';
    }

    aiGetStore()._suggestion = JSON.stringify(data);

    html += '<div style="padding:12px 18px;border-top:1px solid #e5e7eb;margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">';
    html += '<button id="ai-apply-btn" onclick="aiApplyResolution()" style="' + aiBtnCss('linear-gradient(135deg,#6366f1,#8b5cf6)') + 'flex:1;min-width:150px;">Resolved - Mark as Done</button>';
    html += '<button onclick="aiCopySteps()" style="' + aiBtnCss('#0891b2') + '">Copy Steps</button>';
    html += '<button onclick="aiHidePanel()" style="' + aiBtnCss('#6b7280') + '">Skip</button>';
    html += '</div>';

    panel.innerHTML = html;
}

function aiApplyResolution() {
    var store = aiGetStore();
    if (!store._suggestion) return;
    var data;
    try { data = JSON.parse(store._suggestion); } catch (e) { return; }

    var text = '';
    if (data.summaryResolution) text += data.summaryResolution + '\n\n';
    if (data.stepByStepInstructions && data.stepByStepInstructions.length > 0) {
        text += 'Resolution Steps:\n';
        for (var i = 0; i < data.stepByStepInstructions.length; i++) {
            text += (i + 1) + '. ' + data.stepByStepInstructions[i] + '\n';
        }
    }
    if (data.codeOrCommandSnippet) text += '\nCommand: ' + data.codeOrCommandSnippet;
    text += '\n\n[AI Deflection Engine | Confidence: ' + (data.confidenceScore || 0) + '%]';

    try {
        g_form.setValue('close_notes', text);
        g_form.setValue('state', '6');
        g_form.setValue('close_code', 'Closed/Resolved by Caller');
        var btn = document.getElementById('ai-apply-btn');
        if (btn) { btn.innerHTML = 'Applied!'; btn.style.background = '#059669'; }
        g_form.addInfoMessage('AI Resolution applied to Close Notes. Review and click Submit when ready.');
        aiHidePanel();
    } catch (e) {
        g_form.addErrorMessage('Error applying resolution: ' + e);
    }
}

function aiCopySteps() {
    var store = aiGetStore();
    if (!store._suggestion) return;
    var data;
    try { data = JSON.parse(store._suggestion); } catch (e) { return; }

    var text = '';
    if (data.summaryResolution) text += data.summaryResolution + '\n\n';
    if (data.stepByStepInstructions) {
        for (var i = 0; i < data.stepByStepInstructions.length; i++) {
            text += (i + 1) + '. ' + data.stepByStepInstructions[i] + '\n';
        }
    }
    if (data.codeOrCommandSnippet) text += '\n' + data.codeOrCommandSnippet;

    try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        g_form.addInfoMessage('Resolution steps copied to clipboard!');
    } catch (e) {
        g_form.addInfoMessage('Steps: ' + text.substring(0, 200));
    }
}

function aiGetOrCreatePanel() {
    var panel = document.getElementById('ai-defl-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'ai-defl-panel';
    panel.style.cssText = 'display:none;margin:0 0 14px 0;background:#fff;border:1.5px solid #c7d2fe;border-radius:10px;box-shadow:0 4px 20px rgba(99,102,241,0.12);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;font-size:13px;overflow:hidden;';

    var targets = [
        document.querySelector('.form-group[data-field-name="short_description"]'),
        document.querySelector('tr[id$="short_description_label"]'),
        document.querySelector('.form_body'),
        document.querySelector('.section_div'),
        document.querySelector('form')
    ];

    var inserted = false;
    for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].parentNode) {
            targets[i].parentNode.insertBefore(panel, targets[i]);
            inserted = true;
            break;
        }
    }
    if (!inserted) {
        document.body.insertBefore(panel, document.body.firstChild);
    }
    return panel;
}

function aiBtnCss(bg) {
    return 'background:' + bg + ';color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;white-space:nowrap;';
}

function aiEsc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
