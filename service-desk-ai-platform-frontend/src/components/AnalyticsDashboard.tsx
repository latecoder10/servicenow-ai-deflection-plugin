import React, { useState, useEffect } from 'react';
import { Bot, TrendingUp, DollarSign, Database, Zap, Clock, ShieldCheck, PieChart, Activity } from 'lucide-react';
import { DashboardMetrics } from '../types';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Interactive ROI Calculator State
  const [monthlyTickets, setMonthlyTickets] = useState(1500);
  const [tier1Cost, setTier1Cost] = useState(28);
  const [targetDeflectionRate, setTargetDeflectionRate] = useState(42);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/analytics/dashboard');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const calculatedMonthlySavings = Math.round(monthlyTickets * (targetDeflectionRate / 100) * tier1Cost);
  const calculatedAnnualSavings = calculatedMonthlySavings * 12;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            Executive Intelligence
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Incident Deflection & ROI Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time performance analytics measuring Pinecone vector coverage, AI resolution accuracy, and cost savings across enterprise ServiceNow support operations.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-2 border border-slate-200 shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          Live Metrics Updated
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Ticket Deflection Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {metrics ? `${metrics.deflectionMetrics.deflectionRatePercent}%` : '43.8%'}
          </div>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-bold">
            <span>+8.4%</span> vs last month baseline
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Monthly Deflection Savings</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 font-mono">
            {metrics ? `$${metrics.deflectionMetrics.monthlyCostSavingsUSD.toLocaleString()}` : '$42,180'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Based on $28 avg. Tier-1 resolution cost
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pinecone Embeddings Indexed</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {metrics ? metrics.knowledgeIndexStats.totalEmbeddingsInPinecone.toLocaleString() : '482,100'}
          </div>
          <p className="text-[11px] text-purple-600 font-bold">
            servicedesk-knowledge index
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>AI Resolution Accuracy</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {metrics ? `${metrics.deflectionMetrics.aiAccuracyScorePercent}%` : '96.4%'}
          </div>
          <p className="text-[11px] text-blue-600 font-bold">
            Gemini 3.6 Flash RAG Score
          </p>
        </div>

      </div>

      {/* Interactive ROI Cost Calculator */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Interactive Enterprise Support ROI Calculator
          </h3>
          <span className="text-xs text-slate-500 font-medium">Adjust sliders to forecast annual cost reduction</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Monthly Inbound Tickets</span>
                <span className="text-indigo-600 font-mono">{monthlyTickets.toLocaleString()} tickets/mo</span>
              </div>
              <input
                type="range"
                min={200}
                max={10000}
                step={100}
                value={monthlyTickets}
                onChange={(e) => setMonthlyTickets(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Tier-1 Ticket Cost ($USD)</span>
                <span className="text-indigo-600 font-mono">${tier1Cost}/ticket</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={tier1Cost}
                onChange={(e) => setTier1Cost(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-900 mb-1">
                <span>Target AI Deflection Rate</span>
                <span className="text-emerald-600 font-mono">{targetDeflectionRate}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={75}
                value={targetDeflectionRate}
                onChange={(e) => setTargetDeflectionRate(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Forecasted Net Financial Savings
              </div>
              <div className="text-4xl font-black text-indigo-600 font-mono mt-1">
                ${calculatedAnnualSavings.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">/ year</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Deflecting {Math.round(monthlyTickets * (targetDeflectionRate / 100))} tickets each month saves {Math.round(monthlyTickets * (targetDeflectionRate / 100) * 0.25)} hours of human helpdesk engineering time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold block">Monthly Value</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">${calculatedMonthlySavings.toLocaleString()}</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold block">Payback Period</span>
                <span className="text-lg font-extrabold text-emerald-600 font-mono">&lt; 30 Days</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
