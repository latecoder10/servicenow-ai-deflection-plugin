import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/components/DashboardPage';
import { KnowledgePage } from './features/knowledge/components/KnowledgePage';
import { SuggestionsPage } from './features/suggestions/components/SuggestionsPage';
import { ConnectorsPage } from './features/connectors/components/ConnectorsPage';
import { PipelinePage } from './features/pipeline/components/PipelinePage';
import { FilesPage } from './features/files/components/FilesPage';
import { SettingsPage } from './features/settings/components/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="suggestions" element={<SuggestionsPage />} />
          <Route path="connectors" element={<ConnectorsPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
