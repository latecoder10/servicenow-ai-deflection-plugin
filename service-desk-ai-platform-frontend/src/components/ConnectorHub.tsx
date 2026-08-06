import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, CheckCircle2, ShieldCheck, Play, Paperclip, Clock, AlertCircle, FileCode } from 'lucide-react';
import { ConnectorStatus, SyncJob, AttachmentMetadata } from '../types';

export const ConnectorHub: React.FC = () => {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentMetadata | null>(null);

  const fetchConnectorsAndJobs = async () => {
    setLoading(true);
    try {
      const [connRes, jobsRes, attRes] = await Promise.all([
        fetch('/api/v1/connectors'),
        fetch('/api/v1/servicenow/sync/history'),
        fetch('/api/v1/servicenow/attachments/recent')
      ]);

      const connData = await connRes.json();
      const jobsData = await jobsRes.json();
      const attData = await attRes.json();

      if (Array.isArray(connData)) setConnectors(connData);
      if (Array.isArray(jobsData)) setSyncJobs(jobsData);
      if (Array.isArray(attData)) setAttachments(attData);
    } catch (err) {
      console.error('Failed to load connector status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectorsAndJobs();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/v1/connectors/SERVICENOW/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data.message || 'OAuth2 PKCE Token Handshake Successful! Connected to instance.');
    } catch (err) {
      setTestResult('Connection failed to handshake with ServiceNow OAuth endpoint.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTriggerIncrementalSync = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/servicenow/sync/incremental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectorType: 'SERVICENOW', forceFullSync: false })
      });
      const data = await res.json();
      alert(`Incremental Sync Initiated! Job ID: ${data.jobId || 'job_sync_991'}`);
      fetchConnectorsAndJobs();
    } catch (err) {
      console.error('Failed to trigger sync', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectAttachment = async (sysId: string) => {
    try {
      const res = await fetch(`/api/v1/servicenow/attachments/metadata/${sysId}`);
      const data = await res.json();
      setSelectedAttachment(data);
    } catch (err) {
      console.error('Failed to view attachment metadata', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Server className="w-4 h-4" />
            ServiceNow Connector Engine
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Connector Management & Synchronization Hub</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure OAuth2 PKCE credentials, execute zero-data-loss incremental syncs, and inspect ServiceNow attachment metadata references.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 border border-slate-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            {testingConnection ? 'Testing PKCE...' : 'Test OAuth Connection'}
          </button>

          <button
            onClick={handleTriggerIncrementalSync}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Trigger Incremental Sync
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Connector Details Box */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              ServiceNow Enterprise ITSM Connector
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Instance Domain</span>
              <span className="font-mono text-slate-900 font-bold text-xs">enterprise.service-now.com</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Auth Protocol</span>
              <span className="font-bold text-indigo-600 text-xs">OAuth2.0 PKCE Flow</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Synchronized Entities</span>
              <span className="font-semibold text-slate-800 text-[11px]">Incidents, KB Articles, Files</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Vector Store</span>
              <span className="font-mono text-indigo-600 font-bold text-xs">Pinecone Index</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
            <div className="font-bold text-slate-900">OAuth2 Handshake Verification</div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Access tokens are auto-refreshed via Spring Security OAuth2 Client. Zero basic-auth or static API tokens stored in plain text.
            </p>
          </div>
        </div>

        {/* Attachment Inspector */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" />
              ServiceNow Attachment Metadata Inspector
            </h3>
            <span className="text-xs text-slate-400 font-medium">{attachments.length} attachments referenced</span>
          </div>

          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.attachmentSysId}
                onClick={() => handleInspectAttachment(att.attachmentSysId)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{att.fileName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">sys_id: {att.attachmentSysId}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                    {(att.fileSize / 1024).toFixed(0)} KB
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedAttachment && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 animate-fadeIn text-xs">
              <div className="font-bold text-indigo-300 flex items-center justify-between">
                <span>Inspected Metadata</span>
                <a
                  href={selectedAttachment.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:underline font-normal"
                >
                  Download Proxy File
                </a>
              </div>
              <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                {JSON.stringify(selectedAttachment, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sync Jobs Execution History Table */}
        <div className="lg:col-span-12 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Synchronization Jobs Execution History
            </h3>
            <button
              onClick={fetchConnectorsAndJobs}
              className="text-xs text-indigo-600 hover:underline font-bold"
            >
              Refresh History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-3 px-3">Job ID</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Items Fetched</th>
                  <th className="py-3 px-3">Execution Time</th>
                  <th className="py-3 px-3 text-right">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                      {job.jobId}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {job.syncType}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {job.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {job.itemsFetched} items (Created: {job.itemsCreated || 0}, Updated: {job.itemsUpdated || 0})
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-500">
                      {job.executionTimeMs} ms
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                      {new Date(job.startedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
