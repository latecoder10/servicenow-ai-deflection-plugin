import React from 'react';
import { Card } from '../../../components/ui/Card';
import { StatusChip } from '../../../components/ui/StatusChip';
import { SyncJobEntity } from '../../../types/pipeline';
import { formatDate, formatDurationMs } from '../../../utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowForwardRounded } from '../../../icons';

export interface RecentActivityProps {
  jobs: SyncJobEntity[];
  loading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ jobs }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      title="Recent Knowledge Ingestion Activity"
      subtitle="Latest vector embedding and ServiceNow sync jobs execution telemetry"
      action={
        <Button
          size="small"
          onClick={() => navigate('/pipeline')}
          endIcon={<ArrowForwardRounded />}
          sx={{ color: isDark ? '#58a6ff' : '#0366d6', fontWeight: 600 }}
        >
          View All Jobs
        </Button>
      }
      noPadding
    >
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ backgroundColor: isDark ? '#161b22' : '#f6f8fa' }}>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Job ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Connector</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Sync Type</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Items Synced</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>Started</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                  No recent ingestion activity recorded.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id || job.jobId} hover sx={{ '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8f9fa' } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem', color: isDark ? '#58a6ff' : '#0366d6' }}>
                    {job.jobId || job.id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{job.connectorType || 'SERVICENOW'}</TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>{job.syncType}</TableCell>
                  <TableCell>
                    <StatusChip status={job.status} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{job.itemsCreated + job.itemsUpdated}</TableCell>
                  <TableCell sx={{ color: theme.palette.text.secondary }}>{formatDurationMs(job.executionTimeMs)}</TableCell>
                  <TableCell sx={{ color: theme.palette.text.secondary }}>{formatDate(job.startedAt || job.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

