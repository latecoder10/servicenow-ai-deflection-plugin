import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ServiceNowPluginView } from './components/ServiceNowPluginView';
import { DeflectionEngine } from './components/DeflectionEngine';
import { KnowledgeExplorer } from './components/KnowledgeExplorer';
import { ConnectorHub } from './components/ConnectorHub';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { KnowledgeRecord } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [springBootConnected, setSpringBootConnected] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [knowledgeRecords, setKnowledgeRecords] = useState<KnowledgeRecord[]>([]);
  const [selectedTriggerTitle, setSelectedTriggerTitle] = useState<string>('');

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/v1/health');
      if (res.ok) {
        setSpringBootConnected(true);
      } else {
        setSpringBootConnected(false);
      }
    } catch (err) {
      setSpringBootConnected(false);
    }
  };

  const fetchKnowledgeRecords = async () => {
    try {
      const res = await fetch('/api/v1/knowledge/records');
      const data = await res.json();
      if (Array.isArray(data)) {
        setKnowledgeRecords(data);
      }
    } catch (err) {
      console.error('Failed to load initial knowledge records', err);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchKnowledgeRecords();
  }, []);

  const handleTriggerDeflectionFromDashboard = (title: string) => {
    setSelectedTriggerTitle(title);
    setActiveTab('deflection');
  };

  return (
    <div className="min-h-screen bg-[#f4f5f8] text-slate-900 flex font-sans antialiased">
      
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        springBootConnected={springBootConnected}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area next to Sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${sidebarOpen ? 'md:ml-64 ml-0' : 'md:ml-18 ml-0'}`}>
        
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          springBootConnected={springBootConnected}
          onRefreshHealth={checkHealth}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onNavigateTab={setActiveTab}
              knowledgeRecords={knowledgeRecords}
              onTriggerDeflection={handleTriggerDeflectionFromDashboard}
            />
          )}

          {activeTab === 'servicenow-plugin' && (
            <ServiceNowPluginView
              knowledgeRecords={knowledgeRecords}
              onTriggerDeflection={handleTriggerDeflectionFromDashboard}
            />
          )}

          {activeTab === 'deflection' && (
            <DeflectionEngine initialQuery={selectedTriggerTitle} />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeExplorer />
          )}

          {activeTab === 'connector' && (
            <ConnectorHub />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard />
          )}
        </main>

        {/* Footer Status Bar */}
        <footer className="border-t border-slate-200/80 bg-white py-3 px-4 sm:px-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">AI Service Desk Knowledge Platform</span>
              <span>•</span>
              <span>Spring Boot 3.4, Google Gemini 3.6 Flash & Pinecone Vector Store</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
              <span>OAuth2 PKCE: Active</span>
              <span>Index: servicedesk-knowledge</span>
              <span className="text-emerald-600 font-bold">Status: Healthy</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}

export default App;
