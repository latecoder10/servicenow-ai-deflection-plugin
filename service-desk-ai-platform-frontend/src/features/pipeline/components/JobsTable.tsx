import React from 'react';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { StatusChip } from '../../../components/ui/StatusChip';
import { JobProgress } from './JobProgress';
import { SyncJobEntity } from '../../../types/pipeline';
import { formatDate, formatDurationMs } from '../../../utils/formatters';
import { IconButton, Box, Tooltip } from '@mui/material';
import { OpenInNewRounded } from '../../../icons';

export interface JobsTableProps {
  jobs: SyncJobEntity[];
  loading?: boolean;
  onViewDetail: (jobId: string) => void;
}

export const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  loading = false,
  onViewDetail,
}) => {
  const columns: Column<SyncJobEntity>[] = [
    {
      id: 'jobId',
      label: 'Job ID',
      minWidth: 140,
      render: (row) => (
        <Box sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0366d6' }}>
          {row.jobId}
        </Box>
      ),
    },
    {
      id: 'connectorType',
      label: 'Connector',
      minWidth: 130,
      render: (row) => (
        <Box sx={{ fontWeight: 600, color: '#24292e' }}>
          {row.connectorType}
        </Box>
      ),
    },
    {
      id: 'syncType',
      label: 'Mode',
      minWidth: 110,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: 'progress',
      label: 'Progress',
      minWidth: 180,
      render: (row) => (
        <JobProgress
          status={row.status}
          itemsCreated={row.itemsCreated}
          itemsFailed={row.itemsFailed}
        />
      ),
    },
    {
      id: 'startedAt',
      label: 'Started',
      minWidth: 140,
      render: (row) => formatDate(row.startedAt),
    },
    {
      id: 'executionTimeMs',
      label: 'Duration',
      minWidth: 100,
      render: (row) => (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
          {row.executionTimeMs ? formatDurationMs(row.executionTimeMs) : '-'}
        </Box>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 60,
      sortable: false,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Job Detail">
            <IconButton size="small" onClick={() => onViewDetail(row.jobId)}>
              <OpenInNewRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={jobs}
      loading={loading}
      title="Active & Historical Pipeline Sync Jobs"
      searchPlaceholder="Search jobs by ID, connector, or status..."
      searchKeys={['jobId', 'connectorType', 'status', 'syncType']}
      onRowClick={(row) => onViewDetail(row.jobId)}
      emptyTitle="No pipeline sync jobs found"
      emptyDescription="No synchronization pipeline jobs have been triggered yet."
    />
  );
};
