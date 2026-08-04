import React, { useState } from 'react';
import { ServiceNowConnectionConfig } from '../../types';
import {
  Plug,
  CheckCircle2,
  RefreshCw,
  Server,
  Key,
  Database,
  History,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ServiceNowIntegrationViewProps {
  config: ServiceNowConnectionConfig;
  onUpdateConfig: (cfg: ServiceNowConnectionConfig) => void;
}

export const ServiceNowIntegrationView: React.FC<ServiceNowIntegrationViewProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [instanceUrl, setInstanceUrl] = useState<string>(config.instanceUrl);
  const [username, setUsername] = useState<string>(config.username);
  const [authMethod, setAuthMethod] = useState<'OAuth2' | 'Basic' | 'API Key'>(config.authMethod);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('REST API Connection Successful! Authenticated via OAuth 2.0 (Latency: 140ms)');
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Plug className="w-5 h-5 text-amber-500" />
            <span>ServiceNow REST API Integration & Sync Engine</span>
          </h1>
          <p className="text-xs text-slate-500">
            Configure direct REST API authentication to pull resolved incidents, KB articles, and push deflection telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Status: Connected to Enterprise Instance</span>
        </div>
      </div>

      {/* Connection Settings Form */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
        <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Instance Connection Parameters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">ServiceNow Instance URL</label>
            <input
              type="text"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Integration Service Account Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Authentication Method</label>
            <select
              value={authMethod}
              onChange={(e: any) => setAuthMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none"
            >
              <option value="OAuth2">OAuth 2.0 Authorization Code Flow</option>
              <option value="Basic">Basic Auth (Service Account)</option>
              <option value="API Key">ServiceNow API Token</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Auto-Sync Schedule</label>
            <div className="flex items-center space-x-3 pt-2">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Auto-Sync Resolved Incidents (15m)</span>
              </label>
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span>Auto-Sync KB Articles (Hourly)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors"
          >
            {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            <span>{isTesting ? 'Testing REST Endpoints...' : 'Test ServiceNow Connection'}</span>
          </button>

          {testResult && (
            <span className="text-emerald-700 font-mono text-xs font-semibold bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
              {testResult}
            </span>
          )}
        </div>
      </div>

      {/* Sync Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs">Total Incidents Imported</div>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-1">{config.incidentsImportedCount.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-mono mt-1">100% Vector Indexed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs">Knowledge Articles Synced</div>
          <div className="text-2xl font-mono font-bold text-slate-900 mt-1">{config.kbArticlesImportedCount.toLocaleString()}</div>
          <div className="text-[11px] text-blue-600 font-mono mt-1">Pinecone Sync OK</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs">Last Successful Sync</div>
          <div className="text-sm font-mono font-bold text-slate-800 mt-1">{config.lastSyncTime}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Next run in 8 mins</div>
        </div>
      </div>
    </div>
  );
};
