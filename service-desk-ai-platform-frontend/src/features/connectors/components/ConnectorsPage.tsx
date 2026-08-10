import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Modal, Paper } from '@mui/material';
import { useConnectors } from '../hooks/useConnectors';
import { ConnectorCard } from './ConnectorCard';
import { SyncTriggerDialog } from './SyncTriggerDialog';
import { SyncHistoryTable } from './SyncHistoryTable';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { SyncRequest } from '../../../types/connector';
import { RefreshRounded } from '../../../icons';

export const ConnectorsPage: React.FC = () => {
  const {
    connectors,
    loading,
    error,
    testResults,
    selectedConnectorHistory,
    historyLoading,
    syncLoading,
    testConnector,
    triggerSync,
    fetchConnectorHistory,
    refreshConnectors,
  } = useConnectors();

  const [activeSyncConnector, setActiveSyncConnector] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState<boolean>(false);
  const [activeHistoryConnector, setActiveHistoryConnector] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);

  const handleOpenSyncDialog = (connectorType: string) => {
    setActiveSyncConnector(connectorType);
    setSyncDialogOpen(true);
  };

  const handleConfirmSync = async (connectorType: string, request: SyncRequest) => {
    const result = await triggerSync(connectorType, request);
    if (result) {
      setSyncDialogOpen(false);
      setActiveSyncConnector(null);
    }
  };

  const handleOpenHistory = async (connectorType: string) => {
    setActiveHistoryConnector(connectorType);
    setHistoryModalOpen(true);
    await fetchConnectorHistory(connectorType);
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.5rem' }}>
            Enterprise Data Connectors
          </Typography>
          <Typography variant="body2" sx={{ color: '#586069' }}>
            Configure and synchronize external enterprise knowledge repositories into the vector pipeline
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshRounded />}
          onClick={refreshConnectors}
          disabled={loading}
        >
          Refresh Connectors
        </Button>
      </Box>

      <ErrorAlert error={error} />

      {/* Grid of Connectors */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {connectors.map((cType) => (
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }} key={cType}>
            <ConnectorCard
              connectorType={cType}
              testResult={testResults[cType]}
              onTest={testConnector}
              onSync={handleOpenSyncDialog}
              onViewHistory={handleOpenHistory}
            />
          </Grid>
        ))}
      </Grid>

      {/* Sync Trigger Dialog */}
      <SyncTriggerDialog
        open={syncDialogOpen}
        connectorType={activeSyncConnector}
        onClose={() => setSyncDialogOpen(false)}
        onSubmit={handleConfirmSync}
        loading={syncLoading}
      />

      {/* History Audit Log Modal */}
      <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 900,
            maxHeight: '85vh',
            overflowY: 'auto',
            p: 3,
            borderRadius: '8px',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#24292e' }}>
              Sync Execution Audit Log: {activeHistoryConnector}
            </Typography>
            <Button onClick={() => setHistoryModalOpen(false)} size="small" variant="outlined" color="inherit">
              Close
            </Button>
          </Box>

          <SyncHistoryTable
            jobs={selectedConnectorHistory}
            loading={historyLoading}
            connectorType={activeHistoryConnector || ''}
          />
        </Paper>
      </Modal>
    </Box>
  );
};
