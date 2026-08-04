import React from 'react';
import {
  Search,
  Database,
  RefreshCw,
  Bell,
  Sliders,
  ChevronDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  onSearchClick: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/90 text-slate-800 px-4 flex items-center justify-between sticky top-0 z-40 select-none shadow-xs gap-3">
      {/* Left: Google Cloud Branding & Project Switcher */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center space-x-2.5 pr-3 border-r border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900 whitespace-nowrap">Google Cloud</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200/60 whitespace-nowrap">
                Vertex AI
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Service Desk Platform</div>
          </div>
        </div>

        {/* Project Selector Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg text-xs border border-slate-200/80 cursor-pointer transition-colors shrink-0">
          <span className="text-slate-500 text-[11px]">Project:</span>
          <span className="font-mono text-slate-800 font-semibold text-[11px] truncate max-w-[160px]">prj-servicedesk-ai-prod</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0" />
        </div>

        {/* Spring Boot 3.5 Status badge */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg text-[11px] border border-indigo-200/80 font-medium shrink-0 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Spring Boot 3.5 API</span>
        </div>

        {/* Region & Environment badge */}
        <div className="hidden 2xl:flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-[11px] border border-emerald-200/80 font-medium shrink-0">
          <span>us-central1</span>
        </div>
      </div>

      {/* Middle: Google Search Style Command Input */}
      <div className="flex-1 max-w-xl min-w-[180px] mx-2">
        <button
          onClick={onSearchClick}
          className="w-full bg-slate-100/80 hover:bg-slate-200/60 text-slate-600 rounded-full px-3.5 py-1.5 text-xs flex items-center justify-between transition-all border border-slate-200/70 shadow-2xs group"
        >
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-blue-600 transition-colors" />
            <span className="font-normal text-slate-500 truncate text-xs">
              Search Knowledge Base, Incidents, KB Articles...
            </span>
          </div>
          <kbd className="hidden sm:inline-block bg-white text-slate-400 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200 shrink-0 font-medium shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Integration Indicators & User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
        {/* Pinecone Status */}
        <div className="hidden 2xl:flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-xs border border-slate-200/80 text-slate-700 shrink-0">
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px]">Pinecone:</span>
          <span className="font-mono text-emerald-700 text-[11px] font-bold">284k Active</span>
        </div>

        {/* ServiceNow Sync status */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg text-xs border border-slate-200/80 text-slate-700 shrink-0">
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-[11px] font-medium text-slate-600">SNOW Synced</span>
        </div>

        {/* Security Command Center Status */}
        <div className="hidden lg:flex items-center space-x-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg text-[11px] border border-emerald-200/80 font-medium shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>SOC 2</span>
        </div>

        {/* Quick Settings Icon */}
        <button
          onClick={onSearchClick}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          title="Global Search & AI Filters"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
          </button>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 shrink-0">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-2xs shrink-0">
            AE
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-xs font-semibold text-slate-900 whitespace-nowrap">Ayan EstSpace</div>
            <div className="text-[10px] text-slate-500 whitespace-nowrap">Enterprise Architect</div>
          </div>
        </div>
      </div>
    </header>
  );
};

