import React from 'react';
import { MetricOverview } from '../../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Zap,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AnalyticsViewProps {
  metrics: MetricOverview;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ metrics }) => {
  return (
    <div className="p-6 space-y-6 bg-slate-50 text-slate-800 font-sans max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>Executive Analytics & Deflection ROI Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time telemetry tracking ticket volume reduction, organizational ROI cost savings, and knowledge coverage gaps.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-purple-50 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200 font-mono font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>ROI per Ticket: $15.00</span>
          </div>
        </div>
      </div>

      {/* Primary ROI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs text-slate-500 uppercase font-semibold">Monthly Cost Savings</div>
          <div className="text-3xl font-bold font-mono text-emerald-600">
            ${metrics.monthlyCostSavingsUSD.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-mono">+22% month-over-month growth</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs text-slate-500 uppercase font-semibold">Ticket Volume Reduction %</div>
          <div className="text-3xl font-bold font-mono text-blue-600">
            {metrics.deflectionRatePercent}%
          </div>
          <div className="text-xs text-slate-500 font-mono">12,640 tickets avoided</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs text-slate-500 uppercase font-semibold">AI Resolution Precision</div>
          <div className="text-3xl font-bold font-mono text-indigo-600">
            {metrics.aiSuccessRatePercent}%
          </div>
          <div className="text-xs text-slate-500 font-mono">320 ms average latency</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Deflection Categories */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Top Deflection Categories & Impact</span>
          </h2>

          <div className="space-y-3">
            {[
              { category: 'Network & Security (GlobalConnect VPN)', share: 38, count: '4,803 tickets', savings: '$72,045' },
              { category: 'ERP & Enterprise Apps (SAP S4HANA)', share: 26, count: '3,286 tickets', savings: '$49,290' },
              { category: 'Digital Workplace Tools (Outlook, M365)', share: 21, count: '2,654 tickets', savings: '$39,810' },
              { category: 'Engineering & DevOps (Docker, M3 Silicon)', share: 15, count: '1,897 tickets', savings: '$28,455' },
            ].map((cat, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between items-center font-semibold text-slate-800">
                  <span>{cat.category}</span>
                  <span className="font-mono text-emerald-700">{cat.savings} saved</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${cat.share * 2.5}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>{cat.share}% of total deflection</span>
                  <span>{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Coverage & Gaps */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Knowledge Base Coverage & Unanswered Gaps</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Identified Knowledge Gap #1</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono text-[10px]">High Priority</span>
              </div>
              <p className="text-[11px] text-amber-800">
                142 queries searched for "Workday Expense Claim Receipt Upload Error". No matching KB article exists. Creating an article will save an estimated 180 tickets/month.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Identified Knowledge Gap #2</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono text-[10px]">Medium Priority</span>
              </div>
              <p className="text-[11px] text-amber-800">
                89 queries searched for "Zoom Phone Bluetooth Headset Mic Mute Bug". Runbook missing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
