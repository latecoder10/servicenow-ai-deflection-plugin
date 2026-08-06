import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Database,
  Server,
  BarChart3,
  Bell,
  Search,
  ChevronDown,
  Home,
  Users,
  PanelLeftClose,
  PanelLeft,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  springBootConnected: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggleOpen
}) => {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, badge: null },
    { id: 'servicenow-plugin', label: 'ServiceNow Plugin Widget', icon: Layers, badge: 'Live' },
    { id: 'deflection', label: 'AI Incident Deflection', icon: Zap, badge: 'AI' },
    { id: 'knowledge', label: 'Pinecone Knowledge Store', icon: Database, badge: '482k' },
    { id: 'connector', label: 'ServiceNow Sync Hub', icon: Server, badge: 'OAuth' },
    { id: 'analytics', label: 'ROI & Deflection Analytics', icon: BarChart3, badge: '3.4x' },
  ];

  const handleItemClick = (tabId?: string) => {
    if (tabId) {
      setActiveTab(tabId);
    }
    if (!isOpen) {
      onToggleOpen();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-200 ease-in-out ${
          isOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-18'
        }`}
      >
        <div className="p-3.5 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-1">
            {isOpen ? (
              <>
                <div
                  onClick={() => handleItemClick('dashboard')}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                    SD
                  </div>
                  <div className="min-w-0 animate-fadeIn">
                    <div className="font-extrabold text-slate-900 text-base tracking-tight leading-none flex items-center gap-1">
                      Service Desk <span className="text-[10px] text-indigo-600 font-semibold px-1 py-0.2 bg-indigo-50 rounded border border-indigo-200/60">v2.5</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate block">AI Knowledge Platform</span>
                  </div>
                </div>

                <button
                  onClick={onToggleOpen}
                  title="Collapse Sidebar"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex justify-center w-full">
                <button
                  onClick={onToggleOpen}
                  title="Expand Sidebar"
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-xs transition-colors"
                >
                  SD
                </button>
              </div>
            )}
          </div>

          {/* Search Input */}
          {isOpen ? (
            <div className="relative animate-fadeIn">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => handleItemClick()}
                title="Search"
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Notifications Bar */}
          {isOpen ? (
            <div
              onClick={() => handleItemClick('dashboard')}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors animate-fadeIn"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </div>
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                3
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                onClick={() => handleItemClick('dashboard')}
                title="Notifications (3)"
                className="relative w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 bg-indigo-600 rounded-full absolute top-2 right-2 ring-2 ring-white" />
              </div>
            </div>
          )}

          {/* Main Navigation Menu */}
          <nav className="space-y-1 pt-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isOpen ? 'justify-between px-3' : 'justify-center px-0'
                  } py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {isOpen && item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ServiceNow Platform Modules */}
          {isOpen ? (
            <div className="pt-3 border-t border-slate-100 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Active Integrations</span>
              </div>

              <div className="space-y-1 text-xs">
                <div
                  onClick={() => handleItemClick('servicenow-plugin')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">
                    SN
                  </div>
                  <span>ServiceNow Widget</span>
                </div>

                <div
                  onClick={() => handleItemClick('knowledge')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  <div className="w-3.5 h-3.5 rounded bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                    PC
                  </div>
                  <span>Pinecone Index</span>
                </div>

                <div
                  onClick={() => handleItemClick('connector')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  <div className="w-3.5 h-3.5 rounded bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">
                    OA
                  </div>
                  <span>OAuth2 PKCE Sync</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
              <div
                onClick={() => handleItemClick('servicenow-plugin')}
                title="ServiceNow Plugin"
                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center cursor-pointer font-bold text-xs"
              >
                SN
              </div>
              <div
                onClick={() => handleItemClick('knowledge')}
                title="Pinecone Index"
                className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center cursor-pointer font-bold text-xs"
              >
                PC
              </div>
            </div>
          )}

        </div>

        {/* Footer info: simple clean status */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400">
          {isOpen ? (
            <div className="flex items-center justify-between font-medium">
              <span>Service Desk Platform</span>
              <span className="text-indigo-600 font-bold">v2.5</span>
            </div>
          ) : (
            <div className="flex justify-center font-bold text-indigo-600 text-[10px]">
              v2.5
            </div>
          )}
        </div>

      </aside>
    </>
  );
};


