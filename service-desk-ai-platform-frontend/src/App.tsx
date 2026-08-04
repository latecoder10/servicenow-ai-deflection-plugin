import React, { useState } from 'react';
import {
  NavigationTab,
  KnowledgeDocument,
  KnowledgeArticle,
  ResolvedIncident,
  MetricOverview,
  PipelineJob,
  ServiceNowConnectionConfig,
  AIModelConfig,
  SystemUser,
  AuditLogEntry,
} from './types';
import {
  INITIAL_METRICS,
  INITIAL_DOCUMENTS,
  INITIAL_KNOWLEDGE_ARTICLES,
  INITIAL_RESOLVED_INCIDENTS,
  INITIAL_SERVICENOW_CONFIG,
  INITIAL_AI_CONFIG,
  INITIAL_PIPELINE_JOBS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
} from './data/mockKnowledgeBase';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/overview/OverviewDashboard';
import { KnowledgeHub } from './components/knowledge/KnowledgeHub';
import { AISearchEngine } from './components/aisearch/AISearchEngine';
import { IncidentDeflectionAssist } from './components/incident/IncidentDeflectionAssist';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ServiceNowIntegrationView } from './components/servicenow/ServiceNowIntegrationView';
import { AIConfigurationView } from './components/aiconfig/AIConfigurationView';
import { PipelineMonitorView } from './components/pipeline/PipelineMonitorView';
import { UsersRolesView } from './components/admin/UsersRolesView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SettingsView } from './components/admin/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [metrics, setMetrics] = useState<MetricOverview>(INITIAL_METRICS);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(INITIAL_DOCUMENTS);
  const [articles, setArticles] = useState<KnowledgeArticle[]>(INITIAL_KNOWLEDGE_ARTICLES);
  const [incidents, setIncidents] = useState<ResolvedIncident[]>(INITIAL_RESOLVED_INCIDENTS);
  const [servicenowConfig, setServicenowConfig] = useState<ServiceNowConnectionConfig>(INITIAL_SERVICENOW_CONFIG);
  const [aiConfig, setAiConfig] = useState<AIModelConfig>(INITIAL_AI_CONFIG);
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>(INITIAL_PIPELINE_JOBS);
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Handle successful deflection in simulation
  const handleDeflectSuccess = () => {
    setMetrics((prev) => {
      const newDeflections = prev.ticketsDeflectedCount + 1;
      const newTotalAnalyzed = prev.totalIncidentsAnalyzed + 1;
      const newRate = parseFloat(((newDeflections / newTotalAnalyzed) * 100).toFixed(1));
      const newSavings = prev.monthlyCostSavingsUSD + 15;
      return {
        ...prev,
        ticketsDeflectedCount: newDeflections,
        totalIncidentsAnalyzed: newTotalAnalyzed,
        deflectionRatePercent: newRate,
        monthlyCostSavingsUSD: newSavings,
      };
    });

    // Add Audit log entry
    const newAuditLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: 'Employee Self-Service Portal',
      actorRole: 'User',
      action: 'INCIDENT_DEFLECTED_SUCCESS',
      category: 'Knowledge',
      severity: 'low',
      details: 'Incident deflected prior to ServiceNow creation via Gemini AI recommendation. ROI: +$15.00',
      ipAddress: '192.168.1.104',
    };
    setAuditLogs((prev) => [newAuditLog, ...prev]);
  };

  // Add document
  const handleAddDocument = (newDoc: KnowledgeDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      knowledgeBaseDocumentsCount: prev.knowledgeBaseDocumentsCount + 1,
      totalEmbeddingsCount: prev.totalEmbeddingsCount + newDoc.embeddingCount,
    }));
  };

  // Delete document
  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Re-index document
  const handleReindexDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, lastIndexed: new Date().toLocaleString(), status: 'indexed' }
          : d
      )
    );
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Top Google Enterprise App Header */}
      <Header
        activeTab={activeTab}
        onSearchClick={() => setActiveTab('ai_search')}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Google Enterprise Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          knowledgeBaseCount={documents.length + articles.length}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-800">
          {activeTab === 'overview' && (
            <OverviewDashboard
              metrics={metrics}
              documents={documents}
              articles={articles}
              onNavigateTab={setActiveTab}
            />
          )}

          {[
            'documents',
            'knowledge_articles',
            'resolved_incidents',
            'faqs_sops',
            'confluence_sharepoint',
            'servicenow_sync',
          ].includes(activeTab) && (
            <KnowledgeHub
              activeTab={activeTab}
              documents={documents}
              articles={articles}
              incidents={incidents}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              onReindexDocument={handleReindexDocument}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'ai_search' && <AISearchEngine />}

          {activeTab === 'incident_deflection' && (
            <IncidentDeflectionAssist
              onDeflectSuccess={handleDeflectSuccess}
              articles={articles}
              incidents={incidents}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView metrics={metrics} />}

          {activeTab === 'servicenow_config' && (
            <ServiceNowIntegrationView
              config={servicenowConfig}
              onUpdateConfig={setServicenowConfig}
            />
          )}

          {activeTab === 'ai_config' && (
            <AIConfigurationView
              config={aiConfig}
              onUpdateConfig={setAiConfig}
            />
          )}

          {activeTab === 'pipeline_monitor' && (
            <PipelineMonitorView jobs={pipelineJobs} />
          )}

          {activeTab === 'users_roles' && <UsersRolesView users={users} />}

          {activeTab === 'audit_logs' && <AuditLogsView logs={auditLogs} />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
