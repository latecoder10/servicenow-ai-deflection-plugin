import React, { useState } from 'react';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Share2,
  RefreshCw,
  Search,
  ShieldAlert,
  BarChart3,
  Plug,
  Cpu,
  Activity,
  Users,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  knowledgeBaseCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  knowledgeBaseCount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [knowledgeHubOpen, setKnowledgeHubOpen] = useState<boolean>(
    [
      'documents',
      'knowledge_articles',
      'resolved_incidents',
      'faqs_sops',
      'confluence_sharepoint',
      'servicenow_sync',
    ].includes(activeTab)
  );

  const isKnowledgeActive = [
    'documents',
    'knowledge_articles',
    'resolved_incidents',
    'faqs_sops',
    'confluence_sharepoint',
    'servicenow_sync',
  ].includes(activeTab);

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 text-slate-700 flex flex-col h-full select-none shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header Toggle Bar */}
      <div className="p-2 border-b border-slate-100 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-2">
            Navigation
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors ${
            isCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-blue-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      <div className="py-3 px-2 space-y-1 overflow-y-auto flex-1">
        {/* Overview Tab */}
        <button
          onClick={() => onSelectTab('overview')}
          title="Overview Dashboard"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'}`} />
          {!isCollapsed && <span className="truncate">Overview Dashboard</span>}
        </button>

        {/* Knowledge Hub Group */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              if (isCollapsed) {
                onSelectTab('documents');
              } else {
                setKnowledgeHubOpen(!knowledgeHubOpen);
              }
            }}
            title="Knowledge Hub"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
            } rounded-lg text-xs font-medium transition-all ${
              isKnowledgeActive && (!knowledgeHubOpen || isCollapsed)
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'hover:bg-slate-100/80 text-slate-700'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5 min-w-0 pr-1'}`}>
              <FolderTree className={`w-4 h-4 shrink-0 ${isKnowledgeActive ? 'text-blue-600' : 'text-slate-500'}`} />
              {!isCollapsed && <span className="font-medium text-slate-800 truncate">Knowledge Hub</span>}
            </div>
            {!isCollapsed && (
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono border border-indigo-200/60 font-semibold">
                  {knowledgeBaseCount}
                </span>
                {knowledgeHubOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </div>
            )}
          </button>

          {/* Sub Items */}
          {knowledgeHubOpen && !isCollapsed && (
            <div className="pl-4 space-y-0.5 border-l border-slate-200 ml-3.5 my-1">
              <button
                onClick={() => onSelectTab('documents')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'documents' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">Documents & Files</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('knowledge_articles')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === 'knowledge_articles'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 pr-1">
                  <BookOpen className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'knowledge_articles' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">KB Articles</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">KB</span>
              </button>

              <button
                onClick={() => onSelectTab('resolved_incidents')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === 'resolved_incidents'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 pr-1">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'resolved_incidents' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">Resolved Incidents</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">INC</span>
              </button>

              <button
                onClick={() => onSelectTab('faqs_sops')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === 'faqs_sops'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <HelpCircle className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'faqs_sops' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">FAQs & Runbooks</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('confluence_sharepoint')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === 'confluence_sharepoint'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Share2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'confluence_sharepoint' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">Confluence & SharePoint</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTab('servicenow_sync')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === 'servicenow_sync'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-100/70 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'servicenow_sync' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">ServiceNow Sync</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* AI Section Header */}
        {!isCollapsed ? (
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            AI & Intelligence
          </div>
        ) : (
          <div className="border-t border-slate-200 my-2"></div>
        )}

        {/* AI Search */}
        <button
          onClick={() => onSelectTab('ai_search')}
          title="AI Vector Search Engine"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'ai_search'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <Search className={`w-4 h-4 shrink-0 ${activeTab === 'ai_search' ? 'text-blue-600' : 'text-blue-500'}`} />
          {!isCollapsed && <span className="truncate">AI Vector Search Engine</span>}
        </button>

        {/* Incident Deflection Assist */}
        <button
          onClick={() => onSelectTab('incident_deflection')}
          title="ServiceNow Deflection Assist"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'incident_deflection'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2 min-w-0 pr-1'}`}>
            <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'incident_deflection' ? 'text-blue-600' : 'text-emerald-600'}`} />
            {!isCollapsed && <span className="truncate">SNOW Deflection</span>}
          </div>
          {!isCollapsed && (
            <span className="bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/80 font-mono font-bold shrink-0">
              68% Deflected
            </span>
          )}
        </button>

        {/* Analytics */}
        <button
          onClick={() => onSelectTab('analytics')}
          title="Analytics & Insights"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-purple-500'}`} />
          {!isCollapsed && <span className="truncate">Analytics & Insights</span>}
        </button>

        {/* Infrastructure & Platform Header */}
        {!isCollapsed ? (
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Integrations & Pipeline
          </div>
        ) : (
          <div className="border-t border-slate-200 my-2"></div>
        )}

        {/* ServiceNow Configuration */}
        <button
          onClick={() => onSelectTab('servicenow_config')}
          title="ServiceNow REST Config"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'servicenow_config'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <Plug className={`w-4 h-4 shrink-0 ${activeTab === 'servicenow_config' ? 'text-blue-600' : 'text-amber-500'}`} />
          {!isCollapsed && <span className="truncate">ServiceNow REST Config</span>}
        </button>

        {/* AI Configuration */}
        <button
          onClick={() => onSelectTab('ai_config')}
          title="AI Models & Vector DB"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'ai_config'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <Cpu className={`w-4 h-4 shrink-0 ${activeTab === 'ai_config' ? 'text-blue-600' : 'text-pink-500'}`} />
          {!isCollapsed && <span className="truncate">AI Models & Vector DB</span>}
        </button>

        {/* Pipeline Monitor */}
        <button
          onClick={() => onSelectTab('pipeline_monitor')}
          title="ETL Pipeline Monitor"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'pipeline_monitor'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2 min-w-0 pr-1'}`}>
            <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'pipeline_monitor' ? 'text-blue-600' : 'text-emerald-600'}`} />
            {!isCollapsed && <span className="truncate">ETL Pipeline Monitor</span>}
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        </button>

        {/* Administration Header */}
        {!isCollapsed ? (
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Administration & Governance
          </div>
        ) : (
          <div className="border-t border-slate-200 my-2"></div>
        )}

        {/* Users & Roles */}
        <button
          onClick={() => onSelectTab('users_roles')}
          title="Users & RBAC Roles"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'users_roles'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <Users className={`w-4 h-4 shrink-0 ${activeTab === 'users_roles' ? 'text-blue-600' : 'text-teal-600'}`} />
          {!isCollapsed && <span className="truncate">Users & RBAC Roles</span>}
        </button>

        {/* Audit Logs */}
        <button
          onClick={() => onSelectTab('audit_logs')}
          title="Audit Logs & Security"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'audit_logs'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'audit_logs' ? 'text-blue-600' : 'text-emerald-600'}`} />
          {!isCollapsed && <span className="truncate">Audit Logs & Security</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          title="System Settings"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-slate-100/80 text-slate-700'
          }`}
        >
          <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500'}`} />
          {!isCollapsed && <span className="truncate">System Settings</span>}
        </button>
      </div>

      {/* Footer System Status Card */}
      {!isCollapsed && (
        <div className="mt-auto p-3 border-t border-slate-200/80 bg-slate-50/70 shrink-0">
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between text-slate-800 font-semibold">
              <span className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Pinecone GCP East</span>
              </span>
              <span className="text-emerald-600 text-[10px] font-mono font-bold">99.99%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>LLM: Gemini 3.6 Flash</span>
              <span className="font-semibold text-slate-700">320ms avg</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

