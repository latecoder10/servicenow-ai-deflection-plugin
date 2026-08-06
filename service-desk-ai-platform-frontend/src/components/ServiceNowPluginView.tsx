import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Send,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { KnowledgeRecord, DeflectionSuggestion } from '../types';

interface ServiceNowPluginViewProps {
  knowledgeRecords: KnowledgeRecord[];
  onTriggerDeflection: (title: string) => void;
}

export const ServiceNowPluginView: React.FC<ServiceNowPluginViewProps> = ({
  knowledgeRecords,
}) => {
  const [selectedSysId, setSelectedSysId] = useState<string>(
    knowledgeRecords[0]?.recordSysId || 'sys_inc_101'
  );

  const activeRecord =
    knowledgeRecords.find(r => r.recordSysId === selectedSysId) ||
    knowledgeRecords[0] ||
    {
      recordNumber: 'INC0091823',
      title: 'Outlook Web Access 500 Internal Server Error',
      description: 'OWA crashing during draft save on Chrome and Edge browsers with HTTP 500 internal server error',
      category: 'Software',
      priority: '2 - High',
      department: 'IT Infrastructure',
      state: 'Resolved',
      recordSysId: 'sys_inc_101',
      sysUpdatedOn: new Date().toISOString(),
    };

  const [incNumber, setIncNumber] = useState(activeRecord.recordNumber);
  const [shortDesc, setShortDesc] = useState(activeRecord.title);
  const [desc, setDesc] = useState(activeRecord.description);
  const [category, setCategory] = useState(activeRecord.category);
  const [state, setState] = useState(activeRecord.state);
  const [workNotes, setWorkNotes] = useState<string[]>([]);
  const [newWorkNote, setNewWorkNote] = useState('');

  const [pluginLoading, setPluginLoading] = useState(false);
  const [pluginSuggestion, setPluginSuggestion] = useState<DeflectionSuggestion | null>(null);
  const [insertedToNotes, setInsertedToNotes] = useState(false);

  const handleSelectIncident = (rec: KnowledgeRecord) => {
    setSelectedSysId(rec.recordSysId);
    setIncNumber(rec.recordNumber);
    setShortDesc(rec.title);
    setDesc(rec.description);
    setCategory(rec.category);
    setState(rec.state);
    setPluginSuggestion(null);
    setInsertedToNotes(false);
  };

  const handleRunAiPlugin = async () => {
    if (!shortDesc.trim()) return;
    setPluginLoading(true);
    setPluginSuggestion(null);
    setInsertedToNotes(false);

    try {
      const res = await fetch('/api/v1/suggestions/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: shortDesc,
          description: desc,
          category,
          callerEmail: 'john.doe@enterprise.com',
          minConfidenceThreshold: 75
        })
      });
      const data = await res.json();
      if (data.data || data.confidenceScore) {
        setPluginSuggestion(data.data || data);
      }
    } catch (err) {
      console.error('Plugin execution failed:', err);
    } finally {
      setPluginLoading(false);
    }
  };

  const handleInsertSolutionToWorkNotes = () => {
    if (!pluginSuggestion) return;
    const noteText = `[AI Deflection Plugin Suggestion - Score: ${pluginSuggestion.confidenceScore}%]\n${pluginSuggestion.summaryResolution}\n\nStep-by-step resolution:\n${pluginSuggestion.stepByStepInstructions?.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    setWorkNotes(prev => [noteText, ...prev]);
    setInsertedToNotes(true);
  };

  const handleAddWorkNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkNote.trim()) return;
    setWorkNotes(prev => [newWorkNote, ...prev]);
    setNewWorkNote('');
  };

  const handleAutoResolveInServiceNow = () => {
    setState('Resolved');
    handleInsertSolutionToWorkNotes();
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Top Banner explaining ServiceNow Dashboard Plugin */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            ServiceNow Agent Workspace Plugin Simulator
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Embedded ServiceNow Incident Deflection Widget
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            This simulator shows how our AI Plugin operates inside the official ServiceNow Agent Workspace UI to deliver instant RAG resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ServiceNow OAuth PKCE Active
          </span>
        </div>
      </div>

      {/* Main ServiceNow Workspace Frame */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-100">
        
        {/* Fake ServiceNow Navigation Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-white tracking-wider flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              ServiceNow <span className="text-slate-400 font-normal">| Agent Workspace</span>
            </div>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {incNumber}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">enterprise.service-now.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Workspace Body: Left (ServiceNow Incident Form) + Right (AI Plugin Sidebar Widget) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Side: ServiceNow Incident Form (7 Cols) */}
          <div className="lg:col-span-7 p-5 bg-slate-900 border-r border-slate-800 space-y-4">
            
            {/* Incident Selector Pills */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Active ServiceNow Incident Queue Item
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {knowledgeRecords.slice(0, 5).map(rec => (
                  <button
                    key={rec.recordSysId}
                    onClick={() => handleSelectIncident(rec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                      rec.recordSysId === selectedSysId
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    {rec.recordNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated ServiceNow Ticket Fields */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Incident Form Details
                </div>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  state === 'Resolved' ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700' : 'bg-amber-900/80 text-amber-300 border border-amber-700'
                }`}>
                  State: {state}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Number</label>
                  <input
                    type="text"
                    value={incNumber}
                    readOnly
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Short Description</label>
                <input
                  type="text"
                  value={shortDesc}
                  onChange={e => setShortDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Detailed Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Work Notes Feed */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  ServiceNow Work Notes ({workNotes.length})
                </label>

                <form onSubmit={handleAddWorkNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newWorkNote}
                    onChange={e => setNewWorkNote(e.target.value)}
                    placeholder="Add manual work note..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                  >
                    Post Note
                  </button>
                </form>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {workNotes.map((note, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap font-mono">
                      {note}
                    </div>
                  ))}
                  {workNotes.length === 0 && (
                    <div className="text-[11px] text-slate-500 italic p-2 text-center bg-slate-900/40 rounded-lg">
                      No work notes posted yet. Use the AI Plugin on the right to auto-generate solutions!
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Right Side: Embedded AI Deflection Plugin Widget (5 Cols) */}
          <div className="lg:col-span-5 p-5 bg-slate-950 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-3">
              
              {/* Plugin Header Widget Banner */}
              <div className="p-3 bg-indigo-950/60 border border-indigo-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-indigo-200 tracking-tight">
                      ServiceNow AI Plugin
                    </div>
                    <div className="text-[10px] text-indigo-300/70 font-mono">Pinecone Vector RAG</div>
                  </div>
                </div>

                <button
                  onClick={handleRunAiPlugin}
                  disabled={pluginLoading}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {pluginLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  <span>{pluginLoading ? 'Analyzing...' : 'Run Deflection'}</span>
                </button>
              </div>

              {/* Plugin Content Area */}
              {!pluginSuggestion && !pluginLoading && (
                <div className="p-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/50 text-center space-y-2">
                  <Zap className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-200">
                    AI Incident Assistant Standby
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click <strong>"Run Deflection"</strong> above to extract Pinecone vector matches and synthesize instant step-by-step resolution steps for this ServiceNow ticket.
                  </p>
                </div>
              )}

              {pluginLoading && (
                <div className="p-8 text-center space-y-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-indigo-300">Searching Pinecone 'servicedesk-knowledge'</p>
                  <p className="text-[10px] text-slate-400">Synthesizing Gemini 3.6 resolution model...</p>
                </div>
              )}

              {pluginSuggestion && !pluginLoading && (
                <div className="space-y-3 animate-fadeIn">
                  
                  {/* Score & Category Pill */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">AI Confidence Score</div>
                      <div className="text-xl font-black text-emerald-400 font-mono">
                        {pluginSuggestion.confidenceScore}% ({pluginSuggestion.confidenceBand})
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Deflection Ready
                    </span>
                  </div>

                  {/* Solution Summary */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase">Suggested Resolution</div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {pluginSuggestion.summaryResolution}
                    </p>
                  </div>

                  {/* Step by step */}
                  {pluginSuggestion.stepByStepInstructions && (
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase">Action Steps</div>
                      <ul className="space-y-1 text-slate-300 text-[11px] list-disc pl-4">
                        {pluginSuggestion.stepByStepInstructions.slice(0, 3).map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Insert Actions */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleInsertSolutionToWorkNotes}
                      disabled={insertedToNotes}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:bg-indigo-900/50 disabled:text-indigo-400"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {insertedToNotes ? 'Inserted to Work Notes!' : 'Insert Solution into ServiceNow Work Notes'}
                    </button>

                    <button
                      onClick={handleAutoResolveInServiceNow}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auto-Resolve Ticket in ServiceNow
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Footer Widget Note */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
              <span>ServiceNow Plugin Widget v2.5</span>
              <span>Gemini 3.6 Flash RAG</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
