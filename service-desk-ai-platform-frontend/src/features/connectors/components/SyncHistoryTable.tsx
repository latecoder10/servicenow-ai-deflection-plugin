import React from 'react';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { StatusChip } from '../../../components/ui/StatusChip';
import { SyncJobEntity } from '../../../types/pipeline';
import { formatDate, formatDurationMs } from '../../../utils/formatters';
import { Box } from '@mui/material';

export interface SyncHistoryTableProps {
  jobs: SyncJobEntity[];
  loading?: boolean;
  connectorType: string;
}

export const SyncHistoryTable: React.FC<SyncHistoryTableProps> = ({
  jobs,
  loading = false,
  connectorType,
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
      id: 'syncType',
      label: 'Type',
      minWidth: 100,
      render: (row) => (
        <Box sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
          {row.syncType}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      id: 'itemsFetched',
      label: 'Fetched',
      minWidth: 80,
      align: 'right',
      render: (row) => row.itemsFetched ?? 0,
    },
    {
      id: 'itemsCreated',
      label: 'Created',
      minWidth: 80,
      align: 'right',
      render: (row) => row.itemsCreated ?? 0,
    },
    {
      id: 'itemsFailed',
      label: 'Failed',
      minWidth: 70,
      align: 'right',
      render: (row) => (
        <Box sx={{ color: (row.itemsFailed ?? 0) > 0 ? 'error.main' : 'text.primary', fontWeight: 600 }}>
          {row.itemsFailed ?? 0}
        </Box>
      ),
    },
    {
      id: 'startedAt',
      label: 'Started At',
      minWidth: 150,
      render: (row) => formatDate(row.startedAt),
    },
    {
      id: 'executionTimeMs',
      label: 'Duration',
      minWidth: 100,
      align: 'right',
      render: (row) => (
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
          {row.executionTimeMs ? formatDurationMs(row.executionTimeMs) : '—'}
        </Box>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={jobs}
      loading={loading}
      title={`Sync History: ${connectorType}`}
      searchPlaceholder="Filter jobs by ID, status..."
      searchKeys={['jobId', 'status', 'syncType']}
      emptyTitle="No sync runs recorded"
      emptyDescription={`No execution runs recorded for ${connectorType}. Trigger a sync to begin.`}
    />
  );
};
