import React from 'react';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { StatusChip } from '../../../components/ui/StatusChip';
import { Badge } from '../../../components/ui/Badge';
import { KnowledgeRecord } from '../../../types/knowledge';
import { formatDate } from '../../../utils/formatters';
import { IconButton, Box, Tooltip } from '@mui/material';
import { RefreshRounded, DeleteRounded, OpenInNewRounded } from '../../../icons';

export interface KnowledgeTableProps {
  records: KnowledgeRecord[];
  loading?: boolean;
  onViewDetail: (record: KnowledgeRecord) => void;
  onReindex: (recordSysId: string) => void;
  onDelete: (recordSysId: string) => void;
}

export const KnowledgeTable: React.FC<KnowledgeTableProps> = ({
  records,
  loading = false,
  onViewDetail,
  onReindex,
  onDelete,
}) => {
  const columns: Column<KnowledgeRecord>[] = [
    {
      id: 'recordNumber',
      label: 'Record #',
      minWidth: 120,
      render: (row) => (
        <Box sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0366d6' }}>
          {row.recordNumber}
        </Box>
      ),
    },
    {
      id: 'title',
      label: 'Title',
      minWidth: 240,
      render: (row) => (
        <Box sx={{ fontWeight: 600, color: '#24292e', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.title}
        </Box>
      ),
    },
    {
      id: 'recordType',
      label: 'Type',
      minWidth: 110,
      render: (row) => (
        <Badge
          label={row.recordType === 'INCIDENT' ? 'Incident' : 'Article'}
          color={row.recordType === 'INCIDENT' ? 'primary' : 'success'}
        />
      ),
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 130,
    },
    {
      id: 'priority',
      label: 'Priority',
      minWidth: 90,
      render: (row) => (
        <Box sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
          {row.priority || 'P3'}
        </Box>
      ),
    },
    {
      id: 'state',
      label: 'State',
      minWidth: 110,
      render: (row) => <StatusChip status={row.state} />,
    },
    {
      id: 'connectorType',
      label: 'Source',
      minWidth: 120,
      render: (row) => (
        <Box sx={{ fontSize: '0.8125rem', color: '#586069' }}>
          {row.connectorType || 'SERVICENOW'}
        </Box>
      ),
    },
    {
      id: 'sysCreatedOn',
      label: 'Created',
      minWidth: 140,
      render: (row) => formatDate(row.sysCreatedOn),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 110,
      sortable: false,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Detail">
            <IconButton size="small" onClick={() => onViewDetail(row)}>
              <OpenInNewRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reindex Vector">
            <IconButton size="small" color="primary" onClick={() => onReindex(row.recordSysId)}>
              <RefreshRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete Record">
            <IconButton size="small" color="error" onClick={() => onDelete(row.recordSysId)}>
              <DeleteRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      loading={loading}
      title="Indexed Knowledge Records"
      searchPlaceholder="Filter records by number, title, or category..."
      searchKeys={['recordNumber', 'title', 'category', 'recordType', 'state']}
      onRowClick={onViewDetail}
      emptyTitle="No knowledge records found"
      emptyDescription="No indexed ServiceNow records are currently stored in Pinecone."
    />
  );
};
