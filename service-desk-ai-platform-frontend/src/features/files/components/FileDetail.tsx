import React from 'react';
import { SlideOver } from '../../../components/ui/SlideOver';
import { StatusChip } from '../../../components/ui/StatusChip';
import { KnowledgeDocumentEntity } from '../../../types/file';
import { formatDate, formatBytes } from '../../../utils/formatters';
import { Box, Typography, Stack, Divider } from '@mui/material';
import { getDownloadDocumentUrl } from '../../../api/apiFiles';

export interface FileDetailProps {
  file: KnowledgeDocumentEntity | null;
  open: boolean;
  onClose: () => void;
}

export const FileDetail: React.FC<FileDetailProps> = ({
  file,
  open,
  onClose,
}) => {
  if (!file) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={file.title || file.originalFilename || 'Document Detail'}>
      <Stack spacing={3}>
        {/* Header Metadata */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#586069', display: 'block' }}>
              SOURCE TYPE
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#24292e' }}>
              {file.sourceType || 'UNKNOWN'}
            </Typography>
          </Box>
          <StatusChip status={file.status || 'UNKNOWN'} />
        </Box>

        <Divider />

        {/* Technical Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Document ID:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>
              {file.id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Original Filename:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {file.originalFilename || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              File Size:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatBytes(file.fileSizeBytes)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              MIME Type:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {file.mimeType || 'application/octet-stream'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Quality Score:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0366d6' }}>
              {file.qualityScore ?? 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Created By:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {file.createdBy || 'System'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Created Date:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(file.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#586069' }}>
              Last Updated:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(file.updatedAt)}
            </Typography>
          </Box>
          {file.checksum && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: '#586069' }}>
                Checksum:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>
                {file.checksum}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Download Link */}
        <Box
          component="a"
          href={getDownloadDocumentUrl(file.id)}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'block',
            p: 2,
            borderRadius: '6px',
            border: '1px solid #e1e4e8',
            backgroundColor: '#f6f8fa',
            textAlign: 'center',
            textDecoration: 'none',
            color: '#0366d6',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#f0f7ff' },
          }}
        >
          Download Original File
        </Box>
      </Stack>
    </SlideOver>
  );
};
