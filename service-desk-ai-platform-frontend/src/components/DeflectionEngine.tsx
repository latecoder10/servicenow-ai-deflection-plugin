import React, { useState } from 'react';
import { Zap, CheckCircle2, AlertTriangle, ArrowRight, Copy, Check, Sparkles, Send, Ticket, ShieldAlert } from 'lucide-react';
import { DeflectionSuggestion } from '../types';

interface DeflectionEngineProps {
  initialQuery?: string;
}

export const DeflectionEngine: React.FC<DeflectionEngineProps> = ({ initialQuery = '' }) => {
  const [title, setTitle] = useState(initialQuery || '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Software');
  const [callerEmail, setCallerEmail] = useState('john.doe@enterprise.com');
  const [userDepartment, setUserDepartment] = useState('IT Infrastructure');
  const [minConfidence, setMinConfidence] = useState(75);
  
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<DeflectionSuggestion | null>(null);
  const [copied, setCopied] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<{ number: string; sysId: string } | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);

  const sampleTemplates = [
    {
      label: 'Outlook Web Access 500 Error',
      title: 'OWA Crashing with 500 Internal Server Error when saving draft',
      description: 'Outlook Web Access crashes whenever I try to draft an email on Chrome and Edge browsers. Internal server error 500.',
      category: 'Software',
      department: 'Finance'
    },
    {
      label: 'GlobalProtect VPN SAML MFA Drop',
      title: 'GlobalProtect VPN keeps disconnecting every 30 minutes',
      description: 'SAML MFA authentication timeout causes VPN connection to drop every 30 minutes.',
      category: 'Network',
      department: 'Engineering'
    },
    {
      label: 'SSO & Okta Authenticator Password Reset',
      title: 'Locked out of Okta SSO and MFA Authenticator token expired',
      description: 'Need step-by-step self service SSO password reset and Okta MFA token re-registration procedure.',
      category: 'Identity & Access Management',
      department: 'Human Resources'
    }
  ];

  const handleApplyTemplate = (tpl: typeof sampleTemplates[0]) => {
    setTitle(tpl.title);
    setDescription(tpl.description);
    setCategory(tpl.category);
    setUserDepartment(tpl.department);
    setSuggestion(null);
    setTicketCreated(null);
  };

  const handleResolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() && !description.trim()) return;

    setLoading(true);
    setSuggestion(null);
    setTicketCreated(null);

    try {
      const res = await fetch('/api/v1/suggestions/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          callerEmail,
          userDepartment,
          minConfidenceThreshold: minConfidence
        })
      });

      const data = await res.json();
      if (data.data || data.confidenceScore) {
        setSuggestion(data.data || data);
      }
    } catch (err) {
      console.error('Failed to trigger deflection engine', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicketFallback = async () => {
    setCreatingTicket(true);
    try {
      const res = await fetch('/api/v1/servicenow/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          callerEmail
        })
      });
      const data = await res.json();
      setTicketCreated({
        number: data.number || 'INC0098214',
        sysId: data.sysId || 'sys_inc_9981'
      });
    } catch (err) {
      console.error('Failed to create ticket', err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Spring Boot 3.4 & Gemini 3.6 Deflection Engine
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Real-Time AI Incident Resolution & Deflection</h2>
          <p className="text-xs text-slate-500 mt-1">
            Simulate incoming ServiceNow support tickets and witness immediate, high-confidence AI solutions synthesized from synchronized Pinecone knowledge records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {sampleTemplates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleApplyTemplate(tpl)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 transition-colors text-left font-medium"
            >
              <div className="font-bold text-slate-900">{tpl.label}</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{tpl.category}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Ticket Input Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-2 border-b border-slate-100">
            <Ticket className="w-4 h-4 text-indigo-600" />
            Incoming Support Ticket Input
          </h3>

          <form onSubmit={handleResolve} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Title / Short Description
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Outlook Web Access crashes during draft save"
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the exact error message, system behavior, or steps to reproduce..."
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="Identity & Access Management">Identity & Access Management</option>
                  <option value="Hardware">Hardware</option>
                  <option value="General IT">General IT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={userDepartment}
                  onChange={(e) => setUserDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caller Email</label>
                <input
                  type="email"
                  value={callerEmail}
                  onChange={(e) => setCallerEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confidence Threshold: <span className="text-indigo-600 font-bold">{minConfidence}%</span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (!title && !description)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Synthesizing Pinecone Vectors...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Analyze & Deflect Incident
                </>
              )}
            </button>
          </form>
        </div>

        {/* Resolution Output */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          {!suggestion && !loading && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Sparkles className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="text-slate-900 font-bold text-base mb-1">Ready to Deflect Incidents</h4>
              <p className="text-xs text-slate-500 max-w-md">
                Enter ticket parameters or choose a pre-configured scenario on the left to invoke the Spring Boot AI Deflection Engine.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <Zap className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm">Querying Pinecone Index 'servicedesk-knowledge'</p>
                <p className="text-xs text-slate-500 mt-1">Extracting embeddings & synthesizing Gemini 3.6 resolution...</p>
              </div>
            </div>
          )}

          {suggestion && !loading && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Header result banner */}
              <div className={`p-4 rounded-xl border ${
                suggestion.deflectionSuccessful
                  ? 'bg-emerald-50 border-emerald-200/80'
                  : 'bg-amber-50 border-amber-200/80'
              } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                
                <div className="flex items-start gap-3">
                  {suggestion.deflectionSuccessful ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300/50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300/50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        suggestion.deflectionSuccessful
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        {suggestion.deflectionSuccessful ? 'Deflection Successful' : 'Manual Review Recommended'}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        {suggestion.category} • Urgency: {suggestion.urgencyLevel}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mt-1.5">
                      {suggestion.recommendedTitle}
                    </h4>
                  </div>
                </div>

                {/* Score badge */}
                <div className="text-right shrink-0 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Confidence Score</div>
                  <div className="text-2xl font-black text-indigo-600 font-mono">
                    {suggestion.confidenceScore}%
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    {suggestion.confidenceBand}
                  </div>
                </div>

              </div>

              {/* Summary Resolution */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  AI Solution Summary
                </h5>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {suggestion.summaryResolution}
                </p>
              </div>

              {/* Step-by-Step Instructions */}
              {suggestion.stepByStepInstructions && suggestion.stepByStepInstructions.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Step-by-Step Resolution Guide
                  </h5>
                  <ol className="space-y-2">
                    {suggestion.stepByStepInstructions.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Code / Command Snippet */}
              {suggestion.codeOrCommandSnippet && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Execution Command / Script Snippet
                    </h5>
                    <button
                      onClick={() => handleCopyCode(suggestion.codeOrCommandSnippet!)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 font-bold"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto border border-slate-800">
                    {suggestion.codeOrCommandSnippet}
                  </pre>
                </div>
              )}

              {/* Preventative Tip */}
              {suggestion.preventativeTip && (
                <div className="bg-indigo-50 border border-indigo-200/70 rounded-xl p-3 flex items-center gap-2 text-xs text-indigo-900 font-medium">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>Preventative Tip:</strong> {suggestion.preventativeTip}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  onClick={() => alert('Issue marked as Deflected & Resolved by User!')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept & Mark Issue Deflected
                </button>

                {!ticketCreated ? (
                  <button
                    onClick={handleCreateTicketFallback}
                    disabled={creatingTicket}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/80"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-500" />
                    {creatingTicket ? 'Submitting to ServiceNow...' : 'Did Not Help? Create ServiceNow Ticket'}
                  </button>
                ) : (
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    Created Ticket: <strong className="font-mono text-slate-900">{ticketCreated.number}</strong>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
