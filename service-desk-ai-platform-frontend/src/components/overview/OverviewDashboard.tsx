import React from 'react';
import { MetricOverview, KnowledgeDocument, KnowledgeArticle } from '../../types';
import {
  TrendingUp,
  ShieldAlert,
  Bot,
  Database,
  Clock,
  DollarSign,
  FileText,
  Eye,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  BarChart,
  RefreshCw,
} from 'lucide-react';

interface OverviewDashboardProps {
  metrics: MetricOverview;
  documents: KnowledgeDocument[];
  articles: KnowledgeArticle[];
  onNavigateTab: (tab: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  metrics,
  documents,
  articles,
  onNavigateTab,
}) => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      {/* Top Banner / Welcome Bar (Clean Google Cloud Aesthetic) */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white rounded-2xl p-6 border border-blue-100/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100/80 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              ServiceNow + Google AI Platform
            </span>
            <span className="text-xs text-slate-500 font-medium">• Enterprise RAG Engine</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Knowledge Intelligence & Incident Deflection Platform
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Prevent unnecessary ServiceNow incident creation by intelligently recommending verified resolutions using Pinecone vector embeddings and Gemini 3.6 Flash reasoning before tickets are submitted.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigateTab('incident_deflection')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg text-xs flex items-center space-x-2 transition-all shadow-xs cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Simulate Deflection</span>
          </button>
          <button
            onClick={() => onNavigateTab('ai_search')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-xs flex items-center space-x-2 transition-all shadow-xs cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>AI Vector Search</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Google Cloud Console Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tickets Deflected */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tickets Deflected
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.ticketsDeflectedCount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Deflection Rate:</span>
            <span className="font-semibold text-slate-700 font-mono">{metrics.deflectionRatePercent}%</span>
          </div>
        </div>

        {/* KPI 2: AI Success Rate */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AI Success Rate
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.aiSuccessRatePercent}%
            </span>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
              <Sparkles className="w-3 h-3" /> Gemini 3.6
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Avg Response Time:</span>
            <span className="font-semibold text-slate-700 font-mono">{metrics.avgResponseTimeMs} ms</span>
          </div>
        </div>

        {/* KPI 3: Total ROI Cost Savings */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Cost Savings
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              ${metrics.monthlyCostSavingsUSD.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              $15/ticket
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Analyzed Tickets:</span>
            <span className="font-semibold text-slate-700 font-mono">{metrics.totalIncidentsAnalyzed.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 4: Knowledge Base Size */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Vector Index Size
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.totalEmbeddingsCount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Pinecone
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Documents & Articles:</span>
            <span className="font-semibold text-slate-700 font-mono">{metrics.knowledgeBaseDocumentsCount} items</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Deflection Trend Visualization */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart className="w-4 h-4 text-blue-600" />
                <span>Incident Creation vs AI Deflection Trend (Last 7 Days)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Daily volume of issues searched vs deflected before ServiceNow ticket submission
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-blue-500"></span> Total Searches
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Deflected
              </span>
            </div>
          </div>

          {/* Simple Clean Custom CSS Bar Graph */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {[
              { day: 'Mon', total: 340, deflected: 230 },
              { day: 'Tue', total: 420, deflected: 290 },
              { day: 'Wed', total: 480, deflected: 340 },
              { day: 'Thu', total: 510, deflected: 370 },
              { day: 'Fri', total: 390, deflected: 280 },
              { day: 'Sat', total: 180, deflected: 130 },
              { day: 'Sun', total: 130, deflected: 95 },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-36">
                  {/* Total bar */}
                  <div
                    className="w-1/2 bg-blue-100 hover:bg-blue-200 rounded-t transition-all relative group"
                    style={{ height: `${(item.total / 550) * 100}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none font-mono z-10 whitespace-nowrap">
                      Total: {item.total}
                    </div>
                  </div>
                  {/* Deflected bar */}
                  <div
                    className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all relative group shadow-sm"
                    style={{ height: `${(item.deflected / 550) * 100}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none font-mono z-10 whitespace-nowrap">
                      Deflected: {item.deflected} ({Math.round((item.deflected / item.total) * 100)}%)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 font-mono">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="text-slate-500 text-[11px]">Top Deflection Category</div>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">Network & GlobalConnect VPN</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="text-slate-500 text-[11px]">Most Active Department</div>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">Global Supply Chain & ERP</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="text-slate-500 text-[11px]">Vector Match Precision</div>
              <div className="font-semibold text-emerald-700 text-xs mt-0.5 font-mono">98.4% Cosine Similarity</div>
            </div>
          </div>
        </div>

        {/* Top Department Ticket Deflection Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Department Deflection Rate</span>
              </h2>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
              >
                View Details <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {[
                { name: 'IT Infrastructure', rate: 82, count: '4,120 deflected' },
                { name: 'Enterprise Systems / SAP', rate: 74, count: '3,210 deflected' },
                { name: 'Digital Workplace Services', rate: 68, count: '2,890 deflected' },
                { name: 'Software Engineering', rate: 89, count: '1,420 deflected' },
                { name: 'HR Operations & Workday', rate: 58, count: '1,000 deflected' },
              ].map((dept, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{dept.name}</span>
                    <span className="font-mono text-slate-500">{dept.count} ({dept.rate}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                      style={{ width: `${dept.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Coverage Insight</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-snug">
              Software Engineering leads in self-service deflection (89%) due to structured Confluence & Docker runbooks in Pinecone.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Most Viewed Knowledge Articles & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Viewed Knowledge Articles */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>High-Impact Knowledge Base Articles</span>
            </h2>
            <button
              onClick={() => onNavigateTab('knowledge_articles')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Browse KB ({articles.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {articles.slice(0, 4).map((art) => (
              <div key={art.id} className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-200 shrink-0">
                      {art.articleNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 truncate min-w-0">
                      {art.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                    <span>{art.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" /> {art.viewsCount.toLocaleString()} views
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">
                      {art.associatedIncidentsCount} tickets saved
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 shrink-0 whitespace-nowrap">
                  {art.qualityScore}% AI Score
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Stream (Recent Indexing & Searches) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Live Knowledge & RAG Activity Stream</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" /> Live Sync
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                time: 'Just now',
                action: 'Ticket Deflection Success',
                type: 'deflection',
                detail: 'Employee in Finance resolved "GlobalConnect VPN SSL drop" via KB0010942. ServiceNow ticket avoided.',
              },
              {
                time: '2 mins ago',
                action: 'Vector Index Updated',
                type: 'indexing',
                detail: 'Indexed "SAP_S4HANA_Fiori_SSO_Matrix.xlsx" (160 chunks, 3,820 embeddings in Pinecone).',
              },
              {
                time: '8 mins ago',
                action: 'ServiceNow Sync Completed',
                type: 'servicenow',
                detail: 'Incremental REST sync fetched 42 resolved incidents and 3 new KB articles.',
              },
              {
                time: '14 mins ago',
                action: 'AI Search Query',
                type: 'search',
                detail: 'Searched "Docker Rosetta M3 Silicon crash". Match confidence: 99.2% via Gemini 3.6 Flash.',
              },
            ].map((activity, idx) => (
              <div key={idx} className="flex space-x-3 text-xs p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                <div className="mt-0.5">
                  {activity.type === 'deflection' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {activity.type === 'indexing' && <Database className="w-4 h-4 text-indigo-500" />}
                  {activity.type === 'servicenow' && <RefreshCw className="w-4 h-4 text-sky-500" />}
                  {activity.type === 'search' && <Bot className="w-4 h-4 text-purple-500" />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{activity.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{activity.time}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-snug">{activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
