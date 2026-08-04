import React from 'react';
import { Settings, Save, Bell, Globe, Shield } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <span>Global System & Platform Settings</span>
        </h1>
        <p className="text-xs text-slate-500">
          Configure enterprise webhooks, email alerts, rate limiting, and branding parameters.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
        <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">System Telemetry & Notifications</h2>

        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            <span>Enable Slack / Teams Webhooks for Ticket Deflection Telemetry</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            <span>Send Weekly Executive ROI Savings Email Summaries</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            <span>Automatic Pinecone Vector Index Re-indexing on Document Upload</span>
          </label>
        </div>
      </div>
    </div>
  );
};
