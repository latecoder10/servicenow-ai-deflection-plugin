import React from 'react';
import { PipelineJob } from '../../types';
import {
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  Layers,
  Database,
  FileText,
  Zap,
  Terminal,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface PipelineMonitorViewProps {
  jobs: PipelineJob[];
}

export const PipelineMonitorView: React.FC<PipelineMonitorViewProps> = ({ jobs }) => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>Enterprise Knowledge Ingestion & ETL Pipeline Monitor</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time pipeline monitoring: Upload ➔ Parser ➔ Tesseract OCR ➔ Semantic Chunking ➔ Gemini Embedding ➔ Pinecone Sync.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Workers Active (Throughput: 1,420 vectors/sec)</span>
        </div>
      </div>

      {/* Visual Pipeline Stages Map */}
      <div className="bg-white rounded-2xl p-6 text-slate-800 border border-slate-200/80 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>Real-time ETL Pipeline Processing Flow</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {[
            { step: '1. Ingestion', label: 'File Upload & REST', status: 'completed' },
            { step: '2. Parser', label: 'Layout & Table Extract', status: 'completed' },
            { step: '3. OCR', label: 'Tesseract Image OCR', status: 'completed' },
            { step: '4. Chunking', label: '1024 Token Window', status: 'completed' },
            { step: '5. Embedding', label: 'Gemini 1536d Vector', status: 'completed' },
            { step: '6. Pinecone', label: 'Namespace Upsert', status: 'processing' },
            { step: '7. Search', label: 'RAG Index Verified', status: 'queued' },
          ].map((stg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                stg.status === 'processing'
                  ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs ring-2 ring-blue-500/20'
                  : stg.status === 'completed'
                  ? 'bg-slate-50 border-slate-200/80 text-slate-800'
                  : 'bg-slate-50/50 border-slate-100 text-slate-400'
              }`}
            >
              <div className="font-mono text-[10px] font-bold text-blue-600">{stg.step}</div>
              <div className="font-semibold text-[11px] leading-tight">{stg.label}</div>
              <div className="pt-1">
                {stg.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mx-auto" />}
                {stg.status === 'processing' && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin mx-auto" />}
                {stg.status === 'queued' && <Clock className="w-3.5 h-3.5 text-slate-400 mx-auto" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Processing Jobs */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-sm">{job.fileName}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {job.fileSize}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Job ID: {job.id} • Dept: {job.department} • Started: {job.startTime}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-xs text-blue-600">{job.progressPercent}% Complete</span>
                <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-200 font-bold">
                  {job.currentStage}
                </span>
              </div>
            </div>

            {/* Stages Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {job.stages.map((stg) => (
                <div key={stg.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between items-center font-semibold text-slate-800">
                    <span>{stg.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{stg.durationMs}ms</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono">{stg.details}</p>
                </div>
              ))}
            </div>

            {/* Log Stream Box */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 border-b border-slate-800 pb-1">
                <Terminal className="w-3 h-3 text-emerald-400" /> Execution Logs
              </div>
              {job.logs.map((log, idx) => (
                <div key={idx} className="flex space-x-2">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className="text-emerald-400 font-bold">[{log.level.toUpperCase()}]</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
