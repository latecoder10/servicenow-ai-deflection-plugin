import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  Button as MuiButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Grid,
} from '@mui/material';
import { KnowledgeRecord } from '../../../types/knowledge';
import { StatusChip } from '../../../components/ui/StatusChip';
import { formatDate, formatFileSize } from '../../../utils/formatters';
import { getAttachmentDownloadUrl } from '../../../api/apiServiceNow';
import {
  CancelRounded,
  DownloadRounded,
  FolderRounded,
  RefreshRounded,
  DeleteRounded,
  MenuBookRounded,
  BugReportRounded,
} from '../../../icons';

export interface KnowledgeDetailProps {
  record: KnowledgeRecord | null;
  open: boolean;
  onClose: () => void;
  onReindex: (recordSysId: string) => void;
  onDelete: (recordSysId: string) => void;
}

export const KnowledgeDetail: React.FC<KnowledgeDetailProps> = ({
  record,
  open,
  onClose,
  onReindex,
  onDelete,
}) => {
  if (!record) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 540 },
            p: 3,
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {record.recordType === 'INCIDENT' ? (
              <BugReportRounded sx={{ color: 'primary.main' }} />
            ) : (
              <MenuBookRounded sx={{ color: 'success.main' }} />
            )}
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {record.recordNumber} • {record.recordType}
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.15rem' }}>
            {record.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CancelRounded />
        </IconButton>
      </Box>

      {/* Badges */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <StatusChip status={record.state} />
        <Chip label={record.category || 'General'} size="small" variant="outlined" />
        <Chip label={`Priority: ${record.priority || 'P3'}`} size="small" color="primary" variant="outlined" />
        <Chip label={record.connectorType || 'SERVICENOW'} size="small" color="default" />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Stack spacing={2.5}>
        {/* Description */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            Description
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
            {record.description || 'No description provided.'}
          </Typography>
        </Box>

        {/* Resolution Notes */}
        {record.resolutionNotes && (
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main', mb: 0.5 }}>
              Resolution Notes
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>
              {record.resolutionNotes}
            </Typography>
          </Paper>
        )}

        {/* Work Notes / Comments */}
        {record.workNotes && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
              Work Notes
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
              {record.workNotes}
            </Typography>
          </Box>
        )}

        {/* Attachments */}
        {record.attachments && record.attachments.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
              Attachments ({record.attachments.length})
            </Typography>
            <List disablePadding>
              {record.attachments.map((att) => (
                <ListItem
                  key={att.id || att.attachmentSysId}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '6px',
                    mb: 1,
                    py: 1,
                    px: 1.5,
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      component="a"
                      href={att.downloadUrl || getAttachmentDownloadUrl(att.id || att.attachmentSysId)}
                      target="_blank"
                      download
                    >
                      <DownloadRounded sx={{ fontSize: 18 }} />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <FolderRounded sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary' }}>{att.fileName}</Typography>}
                    secondary={<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{`${formatFileSize(att.fileSize)} • ${formatDate(att.createdOn)}`}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Metadata grid */}
        <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Assignment Group
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {record.assignmentGroup || 'Unassigned'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Workspace / Dept
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {record.workspace || 'Enterprise IT'} / {record.department || 'IT'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Sys Created On
              </Typography>
              <Typography variant="body2">{formatDate(record.sysCreatedOn)}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Sys Updated On
              </Typography>
              <Typography variant="body2">{formatDate(record.sysUpdatedOn)}</Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <MuiButton
            variant="outlined"
            color="primary"
            startIcon={<RefreshRounded />}
            onClick={() => onReindex(record.recordSysId)}
            fullWidth
          >
            Reindex Record
          </MuiButton>
          <MuiButton
            variant="outlined"
            color="error"
            startIcon={<DeleteRounded />}
            onClick={() => onDelete(record.recordSysId)}
            fullWidth
          >
            Delete Vector
          </MuiButton>
        </Box>
      </Stack>
    </Drawer>
  );
};

