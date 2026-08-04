import React, { useState } from 'react';
import {
  KnowledgeDocument,
  KnowledgeArticle,
  ResolvedIncident,
  NavigationTab,
  SourceType,
} from '../../types';
import { KnowledgeExplorerModal } from './KnowledgeExplorerModal';
import {
  FileText,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Share2,
  RefreshCw,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Trash2,
  Plus,
  Database,
  Sparkles,
  Layers,
  ArrowUpDown,
  Tag,
  Check,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  FolderPlus,
} from 'lucide-react';

interface KnowledgeHubProps {
  activeTab: NavigationTab;
  documents: KnowledgeDocument[];
  articles: KnowledgeArticle[];
  incidents: ResolvedIncident[];
  onAddDocument: (doc: KnowledgeDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onReindexDocument: (docId: string) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const KnowledgeHub: React.FC<KnowledgeHubProps> = ({
  activeTab,
  documents,
  articles,
  incidents,
  onAddDocument,
  onDeleteDocument,
  onReindexDocument,
  onSelectTab,
}) => {
  const [selectedDocForModal, setSelectedDocForModal] = useState<KnowledgeDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('All');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>('');

  // Filtering documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All' || doc.department === departmentFilter;
    const matchesType = sourceTypeFilter === 'All' || doc.sourceType === sourceTypeFilter;
    return matchesSearch && matchesDept && matchesType;
  });

  // Simulated File Upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(15);
    setUploadStage('Ingesting File & Parsing Document Layout...');

    setTimeout(() => {
      setUploadProgress(45);
      setUploadStage('Running Tesseract OCR & Section Chunking...');
    }, 800);

    setTimeout(() => {
      setUploadProgress(75);
      setUploadStage('Generating Vector Embeddings (gemini-embedding-2-preview)...');
    }, 1600);

    setTimeout(async () => {
      setUploadProgress(100);
      setUploadStage('Pinecone Index Sync Complete!');

      // Try calling server side document analysis if available
      let qualityScore = 96;
      let summary = 'Parsed and indexed enterprise documentation with semantic chunking for RAG search.';
      let tags = ['Imported', 'SOP', 'Operations', 'ServiceDesk'];

      try {
        const res = await fetch('/api/v1/knowledge/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: 'Sample enterprise document text extracted.',
            sourceType: 'pdf',
            department: 'IT Infrastructure',
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          qualityScore = json.data.qualityScore || 96;
          summary = json.data.summary || summary;
          tags = json.data.tags || tags;
        }
      } catch (err) {
        console.warn('Document analysis API call fallback');
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      let sourceType: SourceType = 'pdf';
      if (ext === 'docx' || ext === 'doc') sourceType = 'word';
      if (ext === 'xlsx' || ext === 'xls') sourceType = 'excel';
      if (ext === 'csv') sourceType = 'csv';
      if (ext === 'pptx' || ext === 'ppt') sourceType = 'powerpoint';

      const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        sourceType,
        department: 'IT Infrastructure & Security',
        owner: 'Ayan EstSpace',
        status: 'indexed',
        embeddingCount: Math.floor(Math.random() * 1000) + 500,
        chunksCount: Math.floor(Math.random() * 50) + 20,
        uploadDate: new Date().toISOString().split('T')[0],
        lastIndexed: new Date().toLocaleString(),
        qualityScore,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        category: 'Imported Knowledge',
        tags,
        summary,
        version: '1.0.0',
      };

      onAddDocument(newDoc);
      setIsUploading(false);
      setUploadProgress(0);
    }, 2400);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      {/* Knowledge Hub Header Tabs */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Knowledge Intelligence Console</span>
          </h1>
          <p className="text-xs text-slate-500">
            Continuously ingest, parse, vector-embed, and sync enterprise documents, KB articles, and ServiceNow incidents into Pinecone.
          </p>
        </div>

        {/* Console Sub-Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs flex-wrap gap-1">
          <button
            onClick={() => onSelectTab('documents')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Documents ({documents.length})
          </button>
          <button
            onClick={() => onSelectTab('knowledge_articles')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'knowledge_articles'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            KB Articles ({articles.length})
          </button>
          <button
            onClick={() => onSelectTab('resolved_incidents')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'resolved_incidents'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolved Incidents ({incidents.length})
          </button>
          <button
            onClick={() => onSelectTab('confluence_sharepoint')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'confluence_sharepoint'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Confluence & SharePoint
          </button>
        </div>
      </div>

      {/* VIEW 1: DOCUMENTS & FILES VIEW */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* File Drag and Drop / Upload Area */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-6 text-white border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/30 text-indigo-300 text-[11px] px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-mono">
                    Multi-Format Enterprise Ingestion
                  </span>
                  <span className="text-xs text-slate-400">• PDF, Word, Excel, CSV, PPT, ZIP</span>
                </div>
                <h2 className="text-base font-bold text-slate-100">
                  Drag & Drop Knowledge Ingestion Pipeline
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Uploaded files undergo automatic layout parsing, OCR text extraction, 1024-token semantic chunking, and vector embedding via <span className="font-mono text-indigo-300">gemini-embedding-2-preview</span> directly into Pinecone.
                </p>
              </div>

              {/* Upload Drop Zone Button */}
              <div className="w-full md:w-auto shrink-0">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95 border border-blue-400/30">
                  <UploadCloud className="w-5 h-5" />
                  <span>Upload Enterprise Knowledge Document</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.txt,.zip"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Upload Progress Bar Overlay */}
            {isUploading && (
              <div className="mt-4 bg-slate-800/90 p-4 rounded-lg border border-slate-700 space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-indigo-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    {uploadStage}
                  </span>
                  <span className="font-mono font-bold text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents by name, department, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto text-xs">
              <div className="flex items-center space-x-1.5">
                <Filter className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">Dept:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  <option value="IT Infrastructure & Security">IT Infrastructure</option>
                  <option value="Enterprise Systems & SAP">Enterprise Systems / SAP</option>
                  <option value="Digital Workplace Services">Digital Workplace</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Type:</span>
                <select
                  value={sourceTypeFilter}
                  onChange={(e) => setSourceTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="word">Word</option>
                  <option value="confluence">Confluence</option>
                  <option value="sharepoint">SharePoint</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">Source Type</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Vectors & Chunks</th>
                    <th className="py-3 px-4">AI Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Indexed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            {doc.sourceType === 'pdf' && <FileText className="w-4 h-4 text-red-500" />}
                            {doc.sourceType === 'excel' && <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                            {doc.sourceType === 'word' && <FileText className="w-4 h-4 text-blue-600" />}
                            {doc.sourceType === 'confluence' && <Share2 className="w-4 h-4 text-sky-500" />}
                            {doc.sourceType === 'sharepoint' && <Share2 className="w-4 h-4 text-teal-600" />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 truncate max-w-xs">{doc.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Owner: {doc.owner} • {doc.fileSize}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 uppercase font-bold">
                          {doc.sourceType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">{doc.department}</td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-indigo-600 font-semibold">{doc.embeddingCount.toLocaleString()} vectors</div>
                        <div className="text-[10px] text-slate-400">{doc.chunksCount} chunks</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200">
                          {doc.qualityScore}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 bg-emerald-100/60 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-300/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Indexed</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{doc.lastIndexed}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedDocForModal(doc)}
                            className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                            title="Preview Chunks & Embeddings"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => onReindexDocument(doc.id)}
                            className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                            title="Re-index Vector Embeddings"
                          >
                            <RefreshCw className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KNOWLEDGE ARTICLES */}
      {activeTab === 'knowledge_articles' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">ServiceNow & Enterprise Knowledge Articles</h2>
              <p className="text-xs text-slate-500">Step-by-step resolution articles synced with ServiceNow KB repository</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Create Article</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => (
              <div key={art.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                    {art.articleNumber}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{art.department}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{art.title}</h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{art.content}</p>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div className="font-semibold text-slate-700 text-[11px]">Resolution Steps ({art.resolutionSteps.length})</div>
                  <ol className="list-decimal pl-4 space-y-0.5 text-slate-600 text-[11px]">
                    {art.resolutionSteps.slice(0, 2).map((step, idx) => (
                      <li key={idx} className="truncate">{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Author: {art.author}</span>
                  <span className="text-emerald-700 font-bold font-mono">{art.associatedIncidentsCount} Tickets Deflected</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: RESOLVED INCIDENTS */}
      {activeTab === 'resolved_incidents' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-900 text-sm">Historical ServiceNow Resolved Incidents</h2>
            <p className="text-xs text-slate-500">Resolved tickets indexed into Pinecone vector storage for automated AI matching</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                  <th className="py-3 px-4">Ticket Number</th>
                  <th className="py-3 px-4">Short Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Resolved By</th>
                  <th className="py-3 px-4">Resolution Notes</th>
                  <th className="py-3 px-4">Times Reused</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{inc.number}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">{inc.shortDescription}</td>
                    <td className="py-3 px-4 text-slate-600">{inc.category}</td>
                    <td className="py-3 px-4 text-slate-600">{inc.resolvedBy}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{inc.resolutionNotes}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{inc.timesReused}x Deflected</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: CONFLUENCE & SHAREPOINT */}
      {activeTab === 'confluence_sharepoint' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-500" />
            <span>Confluence & SharePoint Live Connectors</span>
          </h2>
          <p className="text-xs text-slate-600">Automated webhooks index new pages and wiki updates directly into Pinecone.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Confluence Cloud Connector</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Connected</span>
              </div>
              <p className="text-xs text-slate-500">Synced Spaces: Software Engineering, IT Ops, DevOps Runbooks</p>
              <div className="text-xs font-mono text-indigo-600">Indexed Pages: 1,240 pages (84k vectors)</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">SharePoint Online Connector</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">Connected</span>
              </div>
              <p className="text-xs text-slate-500">Synced Sites: HR Portal, Finance SOPs, Legal Guidelines</p>
              <div className="text-xs font-mono text-indigo-600">Indexed Documents: 640 files (42k vectors)</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DRAWER FOR DOCUMENT EXPLORER */}
      <KnowledgeExplorerModal
        document={selectedDocForModal}
        onClose={() => setSelectedDocForModal(null)}
        onReindex={onReindexDocument}
      />
    </div>
  );
};
