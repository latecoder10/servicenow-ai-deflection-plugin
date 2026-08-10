import React from 'react';
import { Box, Typography, Divider, useTheme } from '@mui/material';
import { Card } from '../../../components/ui/Card';
import { StatusChip } from '../../../components/ui/StatusChip';
import { DashboardResponse } from '../../../types/analytics';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { StorageRounded, CloudSyncRounded } from '../../../icons';

export interface ConnectionStatusCardProps {
  dashboard?: DashboardResponse | null;
  loading?: boolean;
}

export const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({ dashboard }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const snStatus = dashboard?.serviceNowConnection?.status || 'UNKNOWN';
  const snUrl = dashboard?.serviceNowConnection?.instanceUrl || 'Not configured';
  const lastSync = dashboard?.serviceNowConnection?.lastSyncTimestamp;

  const pineconeIndex = dashboard?.knowledgeIndexStats?.activePineconeIndex || 'Not configured';
  const embeddingsCount = dashboard?.knowledgeIndexStats?.totalEmbeddingsInPinecone ?? 0;

  return (
    <Card
      title="Live System Telemetry & Connectors"
      subtitle="Real-time connectivity to enterprise ServiceNow and vector database"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', justifyContent: 'space-between', pt: 0.5 }}>
        {/* ServiceNow Connection Box */}
        <Box
          sx={{
            p: 2,
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(22, 27, 34, 0.7)' : '#f6f8fa',
            border: `1px solid ${isDark ? '#30363d' : '#e1e4e8'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudSyncRounded sx={{ color: isDark ? '#58a6ff' : '#0366d6', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                ServiceNow Instance
              </Typography>
            </Box>
            <StatusChip status={snStatus} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Endpoint
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace', color: isDark ? '#58a6ff' : '#0366d6' }}>
                {snUrl}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Last Knowledge Sync
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {lastSync ? formatDate(lastSync) : 'Never'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Pinecone Vector Index Box */}
        <Box
          sx={{
            p: 2,
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(22, 27, 34, 0.7)' : '#f6f8fa',
            border: `1px solid ${isDark ? '#30363d' : '#e1e4e8'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageRounded sx={{ color: isDark ? '#56d364' : '#28a745', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Pinecone Vector Index
              </Typography>
            </Box>
            <StatusChip status={embeddingsCount > 0 ? 'READY' : 'EMPTY'} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Index Name
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace', color: theme.palette.text.primary }}>
                {pineconeIndex}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                Embeddings Stored
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#56d364' : '#28a745' }}>
                {formatNumber(embeddingsCount)} vectors
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};
