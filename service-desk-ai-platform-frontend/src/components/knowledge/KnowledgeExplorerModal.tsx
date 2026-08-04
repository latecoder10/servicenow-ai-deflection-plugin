import React from 'react';
import { KnowledgeDocument } from '../../types';
import {
  X,
  FileText,
  Database,
  Sparkles,
  Layers,
  User,
  Calendar,
  Tag,
  CheckCircle2,
  RefreshCw,
  Download,
  History,
  Info,
} from 'lucide-react';

interface KnowledgeExplorerModalProps {
  document: KnowledgeDocument | null;
  onClose: () => void;
  onReindex: (docId: string) => void;
}

export const KnowledgeExplorerModal: React.FC<KnowledgeExplorerModalProps> = ({
  document,
  onClose,
  onReindex,
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-100">{document.name}</span>
                <span className="text-[10px] bg-blue-900/80 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-700/50 uppercase">
                  {document.sourceType}
                </span>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-700/50">
                  {document.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">ID: {document.id} • {document.fileSize}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {/* Top Info Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Owner / Department</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-500" /> {document.owner}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Embeddings Count</span>
              <span className="font-mono font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" /> {document.embeddingCount.toLocaleString()} vectors
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Chunks Generated</span>
              <span className="font-mono font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> {document.chunksCount} chunks
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">AI Quality Score</span>
              <span className="font-mono font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {document.qualityScore}/100
              </span>
            </div>
          </div>

          {/* AI Summary Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 text-xs text-slate-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Gemini AI Document Summary</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-sans">
              {document.summary || 'Extracted organizational knowledge document containing resolution policies, step-by-step IT operations instructions, and diagnostic parameters.'}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {document.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-white/80 text-blue-800 text-[10px] font-medium px-2 py-0.5 rounded border border-blue-200/60 flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5 text-blue-500" /> {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Chunks & Vector Preview */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Vector Chunks & Embeddings Inspection</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Model: gemini-embedding-2-preview (1536d)
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {document.chunks && document.chunks.length > 0 ? (
                document.chunks.map((chk, idx) => (
                  <div key={chk.id || idx} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-mono font-bold text-slate-700">Chunk #{idx + 1} ({chk.tokenCount} tokens)</span>
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-[10px]">
                        Pinecone ID: vector-{chk.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-mono bg-white p-2 rounded border border-slate-200">
                      {chk.content}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                      <span className="font-semibold text-slate-600">Sample Vectors:</span>
                      <span className="bg-slate-100 px-1 rounded text-slate-700 font-mono">
                        [{chk.embeddingSample.join(', ')}...]
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 font-mono">
                  {document.contentSample || 'Sample text content extracted and chunked into 1024-token windows for high-precision semantic similarity retrieval.'}
                </div>
              )}
            </div>
          </div>

          {/* Version History */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>Version & Indexing History</span>
            </h3>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[11px]">
                <span className="text-slate-800 font-semibold">v{document.version} (Active)</span>
                <span className="text-slate-500">Indexed on {document.lastIndexed}</span>
                <span className="text-emerald-600">Pinecone Sync OK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Uploaded {document.uploadDate}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onReindex(document.id)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-index Vector Embeddings</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Close Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
