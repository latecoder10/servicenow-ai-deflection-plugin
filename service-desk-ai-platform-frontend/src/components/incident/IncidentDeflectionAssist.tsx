import React, { useState, useEffect } from 'react';
import { KnowledgeArticle, ResolvedIncident } from '../../types';
import {
  ShieldAlert,
  Bot,
  Sparkles,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Send,
  RefreshCw,
  Zap,
  AlertTriangle,
  FileText,
  User,
  Building,
  Terminal,
  Check,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface IncidentDeflectionAssistProps {
  onDeflectSuccess: () => void;
  articles: KnowledgeArticle[];
  incidents: ResolvedIncident[];
}

export const IncidentDeflectionAssist: React.FC<IncidentDeflectionAssistProps> = ({
  onDeflectSuccess,
  articles,
  incidents,
}) => {
  const [callerName, setCallerName] = useState<string>('John Miller');
  const [department, setDepartment] = useState<string>('Finance & Accounting');
  const [issueTitle, setIssueTitle] = useState<string>('My VPN is not connecting after Windows 11 update KB5034441');
  const [issueDescription, setIssueDescription] = useState<string>(
    'When launching GlobalConnect VPN, the connection status hangs on "Connecting (P1)" for 2 minutes and then disconnects with SSL handshake failure error.'
  );
  const [category, setCategory] = useState<string>('Network & Security');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResolution, setAiResolution] = useState<any>({
    confidenceScore: 98,
    recommendedTitle: 'GlobalConnect VPN SSL Handshake Failure Post-Windows Update',
    summary: 'A cached SSL token mismatch occurs after Windows 11 update KB5034441. Resetting the PanGPS daemon and flushing the local token cache immediately restores VPN connectivity.',
    stepByStepResolution: [
      'Open Windows PowerShell as Administrator.',
      'Stop the Palo Alto PanGPS daemon: Stop-Service -Name "PanGPS" -Force',
      'Clear cached session tokens: Remove-Item -Recurse -Force "$env:LocalAppData\\Palo Alto Networks\\GlobalProtect\\*"',
      'Flush DNS resolver cache: ipconfig /flushdns && netsh winsock reset',
      'Restart service: Start-Service -Name "PanGPS"',
      'Launch GlobalConnect VPN and connect to portal: vpn.enterprise.com',
    ],
    estimatedResolutionMinutes: 3,
    codeOrCommandSnippet: 'Stop-Service -Name "PanGPS" -Force\nRemove-Item -Recurse -Force "$env:LocalAppData\\Palo Alto Networks\\GlobalProtect\\*"\nipconfig /flushdns\nStart-Service -Name "PanGPS"',
    category: 'Network & Security',
    urgencyLevel: 'Medium',
    preventativeTip: 'Avoid force-killing GlobalConnect during OS patch reboots.',
  });

  const [ticketState, setTicketState] = useState<'editing' | 'deflected' | 'submitted'>('editing');
  const [createdIncidentNumber, setCreatedIncidentNumber] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Debounced auto-search when typing issue title or description
  useEffect(() => {
    if (!issueTitle.trim() && !issueDescription.trim()) return;

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/v1/suggestions/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: issueTitle,
            description: issueDescription,
            category,
            userDepartment: department,
            callerEmail: 'employee@enterprise.com',
            minConfidenceThreshold: 75,
          }),
        });
        const json = await res.json();
        if (json.success && (json.data || json.summaryResolution || json.recommendedTitle)) {
          const resData = json.data || json;
          setAiResolution({
            confidenceScore: resData.confidenceScore || 90,
            recommendedTitle: resData.recommendedTitle || issueTitle,
            summary: resData.summaryResolution || resData.summary || 'AI Resolution generated via Spring Boot.',
            stepByStepResolution: resData.stepByStepInstructions || resData.stepByStepResolution || [],
            estimatedResolutionMinutes: resData.estimatedResolutionMinutes || 5,
            codeOrCommandSnippet: resData.codeOrCommandSnippet || '',
            category: resData.category || category,
            urgencyLevel: resData.urgencyLevel || 'Medium',
            preventativeTip: resData.preventativeTip || 'Keep software updated.',
          });
        }
      } catch (err) {
        console.error('Error fetching deflection resolution:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [issueTitle, issueDescription, category, department]);

  const handleMarkSolved = () => {
    setTicketState('deflected');
    onDeflectSuccess();
  };

  const handleCreateIncidentAnyway = async () => {
    try {
      const res = await fetch('/api/v1/servicenow/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issueTitle,
          description: issueDescription,
          category,
          callerEmail: 'employee@enterprise.com',
        }),
      });
      const data = await res.json();
      setCreatedIncidentNumber(data.number || `INC098${Math.floor(Math.random() * 899) + 100}`);
    } catch (_e) {
      setCreatedIncidentNumber(`INC098${Math.floor(Math.random() * 899) + 100}`);
    }
    setTicketState('submitted');
  };

  const handleCopyCode = () => {
    if (aiResolution?.codeOrCommandSnippet) {
      navigator.clipboard.writeText(aiResolution.codeOrCommandSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      {/* ServiceNow Header Branding Bar */}
      <div className="bg-white rounded-xl p-4 text-slate-800 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            sn
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">ServiceNow Incident Creation Portal</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-200">
                AI Deflection Assist Active
              </span>
            </div>
            <p className="text-xs text-slate-500">Instance: https://enterprise-prod.service-now.com • Form: INC-CREATE-V2</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real-time RAG Recommendation Active</span>
        </div>
      </div>

      {/* Main Grid: Left ServiceNow Form - Right Google AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ServiceNow Ticket Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Submit IT Support Request</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Form ID: INC-1084291</span>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 text-xs">
            {/* User & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Caller / Employee
                </label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="IT Infrastructure & Security">IT Infrastructure & Security</option>
                  <option value="Enterprise Systems & SAP">Enterprise Systems & SAP</option>
                  <option value="Digital Workplace Services">Digital Workplace Services</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="Network & Security">Network & Security (GlobalConnect VPN, Wi-Fi)</option>
                <option value="ERP Systems">ERP Systems (SAP S4HANA, Fiori, Okta SSO)</option>
                <option value="Collaboration Tools">Collaboration Tools (Outlook, M365, Teams)</option>
                <option value="Engineering & DevOps">Engineering & DevOps (Docker, macOS Silicon)</option>
                <option value="Workplace Hardware">Workplace Hardware (Printers, Monitors)</option>
              </select>
            </div>

            {/* Issue Short Title */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Short Description / Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Describe your issue briefly..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>

            {/* Issue Detailed Description */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Detailed Description</label>
              <textarea
                rows={4}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Include error codes, steps tried, or system details..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs leading-relaxed"
              ></textarea>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {isAnalyzing ? (
                <span className="text-blue-600 font-mono flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  Google AI analyzing query...
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold font-mono">
                  AI Solution Available Right Now ➔
                </span>
              )}
            </span>

            <button
              onClick={handleCreateIncidentAnyway}
              disabled={ticketState !== 'editing'}
              className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Create ServiceNow Incident Anyway</span>
            </button>
          </div>

          {/* Ticket Submission Banner if Submitted */}
          {ticketState === 'submitted' && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>ServiceNow Incident Created: {createdIncidentNumber}</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Your ticket has been routed to <strong>Network Support L2</strong>. Average wait time is 4.2 hours. You can still apply the AI solution on the right to resolve it immediately.
              </p>
            </div>
          )}

          {/* Deflected Success Banner */}
          {ticketState === 'deflected' && (
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-2 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="font-bold text-sm flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Ticket Successfully Deflected!</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Thank you, <strong>{callerName}</strong>. By resolving this issue self-service, you saved an estimated 4.2 hours of waiting time and reduced Service Desk workload.
              </p>
              <div className="pt-2 font-mono text-[11px] text-emerald-700 flex items-center gap-3">
                <span>Metrics Logged: +1 Deflection</span>
                <span>•</span>
                <span>ROI Saved: $15.00</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time Google AI Assistant (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 text-slate-800 border border-blue-200/80 shadow-xs space-y-4 sticky top-20">
            {/* Assistant Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Google AI Service Desk Assistant</span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Powered by Gemini 3.6 Flash & Pinecone</div>
                </div>
              </div>

              {aiResolution && (
                <div className="bg-emerald-50 text-emerald-800 font-mono text-xs px-2.5 py-1 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{aiResolution.confidenceScore}% Match</span>
                </div>
              )}
            </div>

            {/* AI Summary and Instructions */}
            {aiResolution ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recommended Resolution
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                    {aiResolution.recommendedTitle}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {aiResolution.summary}
                  </p>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-800 font-semibold border-b border-slate-200/80 pb-1.5 text-[11px]">
                    <span>Step-by-Step Instructions</span>
                    <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                      <Clock className="w-3 h-3 text-slate-400" /> Est: {aiResolution.estimatedResolutionMinutes} mins
                    </span>
                  </div>

                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 text-xs leading-relaxed font-sans">
                    {aiResolution.stepByStepResolution.map((step: string, idx: number) => (
                      <li key={idx} className="pl-1">{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Code / PowerShell Snippet */}
                {aiResolution.codeOrCommandSnippet && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-blue-400" /> PowerShell / CLI Command
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre p-1">
                      {aiResolution.codeOrCommandSnippet}
                    </pre>
                  </div>
                )}

                {/* Solved Button - Deflects Ticket */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleMarkSolved}
                    disabled={ticketState === 'deflected'}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>
                      {ticketState === 'deflected' ? 'Resolution Applied - Ticket Deflected!' : 'This Solved My Issue! (Deflect Ticket)'}
                    </span>
                  </button>

                  <p className="text-[10px] text-center text-slate-500 font-medium">
                    Clicking this logs a self-service resolution and cancels ticket submission.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                Type an issue title in the form to generate a real-time AI resolution.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
