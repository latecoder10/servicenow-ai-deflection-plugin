import React, { useState } from 'react';
import {
  Search,
  Bell,
  RefreshCw,
  ChevronDown,
  Command,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  springBootConnected: boolean;
  onRefreshHealth: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefreshHealth
}) => {
  const [profileOpen, setProfileOpen] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'servicenow-plugin':
        return 'ServiceNow Dashboard Plugin';
      case 'deflection':
        return 'AI Incident Deflection Engine';
      case 'knowledge':
        return 'Pinecone Vector Store';
      case 'connector':
        return 'ServiceNow Sync Hub';
      case 'analytics':
        return 'ROI & Analytics';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 h-14 flex items-center justify-between">
      
      {/* Left Section: Clean Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
          {getTabTitle()}
        </h1>
      </div>

      {/* Middle Section: Quick Command Bar Trigger */}
      <div
        onClick={() => setActiveTab('deflection')}
        className="hidden md:flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-1.5 w-72 text-xs text-slate-400 cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-500">Search incidents or ask AI...</span>
        </div>
        <div className="flex items-center gap-0.5 text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 shadow-2xs">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </div>
      </div>

      {/* Right Section: Refresh, Notifications & Profile Avatar Dropdown */}
      <div className="flex items-center gap-3">
        
        {/* Refresh Icon */}
        <button
          onClick={onRefreshHealth}
          title="Refresh System Status"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setActiveTab('dashboard')}
            title="Notifications"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-indigo-600 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-100"
            />
            <span className="hidden sm:inline font-bold text-xs text-slate-800">Ethan James</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 text-xs animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">Ethan James</div>
                <div className="text-[11px] text-slate-500">ethan.james@enterprise.com</div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between"
                >
                  <span>Analytics & ROI</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('connector');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  ServiceNow OAuth Settings
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 px-4 py-1.5 text-slate-400 text-[11px] flex items-center justify-between">
                <span>Service Desk v2.5</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};


