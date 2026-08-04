import React from 'react';
import { AuditLogEntry } from '../../types';
import { ShieldCheck, ShieldAlert, Key, Download, Filter } from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Google Security Command Center Audit Trail & API Security</span>
          </h1>
          <p className="text-xs text-slate-500">
            Immutable audit logs recording platform administrative actions, API key access, and Pinecone vector index queries.
          </p>
        </div>

        <button className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Details</th>
              <th className="py-3 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="py-3 px-4 text-slate-500 font-bold">{log.timestamp}</td>
                <td className="py-3 px-4 text-slate-900 font-sans font-semibold">{log.actor}</td>
                <td className="py-3 px-4 text-blue-600 font-bold">{log.action}</td>
                <td className="py-3 px-4 text-purple-700">{log.category}</td>
                <td className="py-3 px-4 text-slate-700 font-sans max-w-sm truncate">{log.details}</td>
                <td className="py-3 px-4 text-slate-400">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
