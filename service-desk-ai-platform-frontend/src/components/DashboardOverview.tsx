import React, { useState } from 'react';
import {
  Zap,
  Server,
  Database,
  Calendar,
  Sparkles,
  Eye,
  CheckCircle2,
  Paperclip,
  MoreVertical,
  ChevronDown,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Lock,
  Mail,
  Search,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { KnowledgeRecord, DeflectionSuggestion } from '../types';

interface DashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
  knowledgeRecords: KnowledgeRecord[];
  onTriggerDeflection: (title: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  knowledgeRecords,
  onTriggerDeflection
}) => {
  const [selectedIncident, setSelectedIncident] = useState<KnowledgeRecord | null>(null);

  const quickActions = [
    {
      id: 'servicenow-plugin',
      title: 'ServiceNow Plugin',
      subtitle: 'Embedded Widget Demo',
      bgColor: 'bg-emerald-100/70 text-emerald-700',
      icon: Zap,
    },
    {
      id: 'deflection',
      title: 'AI Deflection Engine',
      subtitle: 'RAG Ticket Analyzer',
      bgColor: 'bg-indigo-100/70 text-indigo-700',
      icon: Sparkles,
    },
    {
      id: 'knowledge',
      title: 'Pinecone Vector KB',
      subtitle: '482k Synced Embeddings',
      bgColor: 'bg-purple-100/70 text-purple-700',
      icon: Database,
    },
    {
      id: 'connector',
      title: 'ServiceNow Sync Hub',
      subtitle: 'OAuth2 PKCE Connection',
      bgColor: 'bg-blue-100/70 text-blue-700',
      icon: Server,
    },
    {
      id: 'analytics',
      title: 'ROI Analytics',
      subtitle: '$28/Ticket Savings',
      bgColor: 'bg-amber-100/70 text-amber-700',
      icon: Calendar,
    },
  ];

  const projectsAndIntegrations = [
    {
      name: 'ServiceNow ITSM Connector',
      subtitle: 'Active OAuth2 PKCE Connection',
      iconBg: 'bg-emerald-600',
      badge: 'Connected',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      name: 'Pinecone Vector Database',
      subtitle: 'servicedesk-knowledge index',
      iconBg: 'bg-purple-600',
      badge: '482k Vectors',
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      name: 'Google Gemini 3.6 Flash',
      subtitle: 'RAG Synthesis & Resolution Engine',
      iconBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      badge: 'Online',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'ServiceNow Knowledge Sync',
      subtitle: 'Incidents & Published KB Articles',
      iconBg: 'bg-slate-800',
      badge: 'Synced',
      badgeColor: 'bg-slate-100 text-slate-800'
    },
    {
      name: 'Attachment Extractor Engine',
      subtitle: 'PDF & Diagnostic Log Embeddings',
      iconBg: 'bg-cyan-600',
      badge: 'Active',
      badgeColor: 'bg-cyan-100 text-cyan-800'
    },
    {
      name: 'Incident Deflection Logger',
      subtitle: 'Real-time Cost Savings & ROI Tracker',
      iconBg: 'bg-amber-600',
      badge: 'Tracking',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Quick Actions Row (5 Cards Matching Top Section) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigateTab(action.id === 'schedule' ? 'connector' : action.id)}
              className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3 transition-all text-left shadow-sm hover:shadow group"
            >
              <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate leading-snug">
                  {action.title}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {action.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Main 2x2 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quadrant 1: Assigned Incidents & Active Deflections */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Assigned Incidents & Active Deflections</h3>
              <p className="text-xs text-slate-500">Live ticket queue synchronized from ServiceNow</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors">
                  <span>Nearest Due Date</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {knowledgeRecords.slice(0, 5).map((rec) => (
              <div
                key={rec.recordSysId}
                onClick={() => setSelectedIncident(rec)}
                className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3 cursor-pointer transition-all group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
                      {rec.recordNumber} — {rec.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-600">{rec.department}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {rec.state}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono">Updated {new Date(rec.sysUpdatedOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerDeflection(rec.title);
                  }}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-cyan-600 hover:border-cyan-200 flex items-center justify-center shrink-0 shadow-xs transition-colors"
                  title="View AI Deflection"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 2: ServiceNow Connectors & Knowledge Integrations */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Active Connectors & AI Engines</h3>
              <p className="text-xs text-slate-500">Integrated enterprise systems & vector endpoints</p>
            </div>
            <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projectsAndIntegrations.map((proj, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex items-start gap-3 transition-all"
              >
                <div className={`w-9 h-9 rounded-xl ${proj.iconBg} text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs`}>
                  {proj.name.substring(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{proj.name}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${proj.badgeColor}`}>
                      {proj.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{proj.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant 3: Recent Activity & Live Deflection Feed */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">ServiceNow AI Deflection Audit Stream</h3>
              <p className="text-xs text-slate-500">Real-time incident resolutions & Pinecone vector synchronization</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('deflection')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Deflection Tester
              </button>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            
            {/* Audit Item 1 */}
            <div className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                ✓
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">INC0091823 — Deflection Successful</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    96% Confidence
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  Outlook Web Access 500 error resolved automatically via Pinecone RAG knowledge match.
                </p>
                <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                  Action: Auto-inserted solution to ServiceNow Work Notes • Saved $28.00
                </div>
              </div>
            </div>

            {/* Audit Item 2 */}
            <div className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                PC
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Pinecone Vector Index Sync</span>
                  <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                    45 Embeddings
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  Incremental PKCE sync complete. Extracted resolution vectors into <span className="font-mono text-indigo-600">servicedesk-knowledge</span>.
                </p>
                <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                  Source: ServiceNow Incident & KB Sync Job #1002
                </div>
              </div>
            </div>

            {/* Audit Item 3 */}
            <div className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                SN
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">ServiceNow Plugin Widget Invocation</span>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Agent Workspace
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  Embedded widget loaded inside ServiceNow Agent Workspace for ticket INC0091850.
                </p>
                <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                  Latency: 120ms • Model: Gemini 3.6 Flash
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Quadrant 4: ServiceNow AI Platform Specifications */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Platform Technical Architecture</h3>
              <p className="text-xs text-slate-500">ServiceNow OAuth, Pinecone Vector RAG & Gemini 3.6 specs</p>
            </div>
            <button
              onClick={() => onNavigateTab('connector')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              View Connector
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">ServiceNow Instance</div>
              <div className="font-bold text-slate-900 text-xs font-mono truncate">
                enterprise.service-now.com
              </div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> OAuth2 PKCE Active
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Pinecone Index</div>
              <div className="font-bold text-indigo-600 text-xs font-mono truncate">
                servicedesk-knowledge
              </div>
              <div className="text-[10px] text-purple-600 font-bold">
                482,100 Vector Embeddings
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">AI Model Architecture</div>
              <div className="font-bold text-slate-900 text-xs truncate">
                Google Gemini 3.6 Flash
              </div>
              <div className="text-[10px] text-blue-600 font-bold">
                RAG Grounded Response
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Deflection Performance</div>
              <div className="font-bold text-emerald-600 text-xs font-mono">
                68.2% Auto-Deflection Rate
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                $28.00 Saved per Incident
              </div>
            </div>

          </div>

          <div className="p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Tested & Verified with ServiceNow Agent Workspace Dashboard</span>
            </div>
            <button
              onClick={() => onNavigateTab('servicenow-plugin')}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shrink-0"
            >
              Launch Plugin Simulator
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
