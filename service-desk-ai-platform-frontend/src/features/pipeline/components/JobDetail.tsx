import React from 'react';
import { SlideOver } from '../../../components/ui/SlideOver';
import { StatusChip } from '../../../components/ui/StatusChip';
import { SyncJobEntity } from '../../../types/pipeline';
import { formatDate, formatDurationMs } from '../../../utils/formatters';
import { Box, Typography, Grid, Paper, Stack, Divider } from '@mui/material';

export interface JobDetailProps {
  job: SyncJobEntity | null;
  open: boolean;
  onClose: () => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ job, open, onClose }) => {
  if (!job) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={`Sync Job #${job.jobId}`}>
      <Stack spacing={3}>
        {/* Status Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              CONNECTOR SOURCE
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {job.connectorType} ({job.syncType})
            </Typography>
          </Box>
          <StatusChip status={job.status} />
        </Box>

        <Divider />

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <Paper sx={{ p: 1.5, borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Fetched
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {job.itemsFetched || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Paper sx={{ p: 1.5, borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: 'success.main' }}>
                Created
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                {job.itemsCreated || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Paper sx={{ p: 1.5, borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Updated
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {job.itemsUpdated || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Paper sx={{ p: 1.5, borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Deleted
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {job.itemsDeleted || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Paper sx={{ p: 1.5, borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Skipped
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {job.itemsSkipped || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Paper sx={{ p: 1.5, borderRadius: '6px' }}>
              <Typography variant="caption" sx={{ color: (job.itemsFailed ?? 0) > 0 ? 'error.main' : 'text.secondary' }}>
                Failed
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: (job.itemsFailed ?? 0) > 0 ? 'error.main' : 'text.primary' }}>
                {job.itemsFailed || 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Timestamps */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Started At:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(job.startedAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Completed At:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {job.completedAt ? formatDate(job.completedAt) : 'Running...'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Execution Time:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {job.executionTimeMs ? formatDurationMs(job.executionTimeMs) : '—'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Created By:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {job.createdBy || 'System'}
            </Typography>
          </Box>
        </Box>

        {/* Failure Reason */}
        {job.errorMessage && (
          <Box sx={{ p: 2, borderRadius: '6px', backgroundColor: '#ffeef0', border: '1px solid #d73a49' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d73a49', mb: 0.5 }}>
              Pipeline Execution Error
            </Typography>
            <Typography variant="body2" sx={{ color: '#24292e', fontFamily: 'monospace' }}>
              {job.errorMessage}
            </Typography>
          </Box>
        )}
      </Stack>
    </SlideOver>
  );
};
