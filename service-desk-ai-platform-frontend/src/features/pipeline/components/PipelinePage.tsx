import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { usePipelineJobs } from '../hooks/usePipelineJobs';
import { JobsTable } from './JobsTable';
import { JobDetail } from './JobDetail';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { RefreshRounded } from '../../../icons';

export const PipelinePage: React.FC = () => {
  const {
    jobs,
    loading,
    error,
    metrics,
    selectedJob,
    fetchJobs,
    viewJobDetail,
    clearSelectedJob,
  } = usePipelineJobs();

  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  const handleOpenDetail = async (jobId: string) => {
    await viewJobDetail(jobId);
    setDetailOpen(true);
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.5rem' }}>
            Vector Ingestion Pipeline
          </Typography>
          <Typography variant="body2" sx={{ color: '#586069' }}>
            Monitor real-time sync execution jobs, chunking, Gemini embedding extraction, and Pinecone vector indexing
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshRounded />}
          onClick={fetchJobs}
          disabled={loading}
        >
          Refresh Jobs
        </Button>
      </Box>

      <ErrorAlert error={error} />

      {/* Metrics Banner */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              TOTAL PIPELINE JOBS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
              {metrics.totalJobs}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
              ACTIVE / RUNNING
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
              {metrics.runningJobs}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
              COMPLETED RUNS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main', mt: 0.5 }}>
              {metrics.completedJobs}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              TOTAL ITEMS CREATED
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
              {metrics.totalRecordsIndexed}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Jobs Table */}
      <JobsTable
        jobs={jobs}
        loading={loading}
        onViewDetail={handleOpenDetail}
      />

      {/* Slide-over Detail */}
      <JobDetail
        job={selectedJob}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          clearSelectedJob();
        }}
      />
    </Box>
  );
};
