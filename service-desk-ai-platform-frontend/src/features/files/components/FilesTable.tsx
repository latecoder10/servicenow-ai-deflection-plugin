import React from 'react';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { StatusChip } from '../../../components/ui/StatusChip';
import { Badge } from '../../../components/ui/Badge';
import { KnowledgeDocumentEntity } from '../../../types/file';
import { formatDate, formatBytes } from '../../../utils/formatters';
import { Box, IconButton, Tooltip } from '@mui/material';
import { OpenInNewRounded, DownloadRounded } from '../../../icons';
import { getDownloadDocumentUrl } from '../../../api/apiFiles';

export interface FilesTableProps {
  files: KnowledgeDocumentEntity[];
  loading?: boolean;
  onViewDetail: (file: KnowledgeDocumentEntity) => void;
}

export const FilesTable: React.FC<FilesTableProps> = ({
  files,
  loading = false,
  onViewDetail,
}) => {
  const columns: Column<KnowledgeDocumentEntity>[] = [
    {
      id: 'title',
      label: 'Document Title',
      minWidth: 200,
      render: (row) => (
        <Box sx={{ fontWeight: 600, color: '#24292e', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.title || row.originalFilename || 'Untitled'}
        </Box>
      ),
    },
    {
      id: 'sourceType',
      label: 'Source Type',
      minWidth: 130,
      render: (row) => <Badge label={row.sourceType || 'UNKNOWN'} color="primary" />,
    },
    {
      id: 'fileSizeBytes',
      label: 'Size',
      minWidth: 90,
      align: 'right',
      render: (row) => formatBytes(row.fileSizeBytes),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      render: (row) => <StatusChip status={row.status || 'UNKNOWN'} />,
    },
    {
      id: 'qualityScore',
      label: 'Quality',
      minWidth: 80,
      align: 'right',
      render: (row) => (
        <Box sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.qualityScore ?? '-'}
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      minWidth: 140,
      render: (row) => formatDate(row.createdAt),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 80,
      sortable: false,
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Document Detail">
            <IconButton size="small" onClick={() => onViewDetail(row)}>
              <OpenInNewRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download File">
            <IconButton
              size="small"
              color="primary"
              component="a"
              href={getDownloadDocumentUrl(row.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={files}
      loading={loading}
      title="Indexed Knowledge Documents"
      searchPlaceholder="Search documents by title, type, or status..."
      searchKeys={['title', 'sourceType', 'status', 'originalFilename']}
      onRowClick={onViewDetail}
      emptyTitle="No documents found"
      emptyDescription="Upload PDF, DOCX, or text files to index them into the knowledge base."
    />
  );
};
