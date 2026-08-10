import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ConnectorHealthBadge } from './ConnectorHealthBadge';
import { Box, Typography, Divider, Stack } from '@mui/material';
import { ConnectorTestResult } from '../../../types/connector';
import { SyncRounded, ApiRounded, AccessTimeRounded } from '../../../icons';

export interface ConnectorCardProps {
  connectorType: string;
  testResult?: ConnectorTestResult;
  onTest: (connectorType: string) => void;
  onSync: (connectorType: string) => void;
  onViewHistory: (connectorType: string) => void;
}

const CONNECTOR_META: Record<string, { title: string; desc: string; icon: string; color: string }> = {
  SERVICENOW: {
    title: 'ServiceNow ITSM',
    desc: 'Extract resolved incidents, KB articles, and sync into Pinecone vector index',
    icon: 'SN',
    color: '#0366d6',
  },
};

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  connectorType,
  testResult,
  onTest,
  onSync,
  onViewHistory,
}) => {
  const meta = CONNECTOR_META[connectorType] || {
    title: connectorType,
    desc: 'Enterprise external data source connector',
    icon: connectorType.slice(0, 2),
    color: '#24292e',
  };

  const status = testResult?.status || 'CONNECTED';

  return (
    <Card
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                backgroundColor: meta.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.875rem',
              }}
            >
              {meta.icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#24292e', lineHeight: 1.2 }}>
                {meta.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#586069' }}>
                Connector Type: {connectorType}
              </Typography>
            </Box>
          </Box>
          <ConnectorHealthBadge status={status} />
        </Box>
      }
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ flexGrow: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#586069', mb: 2, minHeight: 40 }}>
          {meta.desc}
        </Typography>

        {testResult && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: '6px',
              backgroundColor: status === 'CONNECTED' ? '#e6f4ea' : '#ffeef0',
              border: `1px solid ${status === 'CONNECTED' ? '#28a74533' : '#d73a4933'}`,
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#24292e', display: 'block' }}>
              Status: {status}
            </Typography>
            <Typography variant="caption" sx={{ color: '#586069' }}>
              {testResult.message || 'Connection verified.'}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<ApiRounded />}
            onClick={() => onTest(connectorType)}
            fullWidth
          >
            Test Auth
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SyncRounded />}
            onClick={() => onSync(connectorType)}
            fullWidth
          >
            Trigger Sync
          </Button>
        </Box>
        <Button
          variant="text"
          color="inherit"
          size="small"
          startIcon={<AccessTimeRounded />}
          onClick={() => onViewHistory(connectorType)}
          fullWidth
        >
          View Sync Audit History
        </Button>
      </Stack>
    </Card>
  );
};
