import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  CloudSyncRounded,
  ScienceRounded,
  PsychologyRounded,
  UploadFileRounded,
  SearchRounded,
} from '../../../icons';

export interface QuickActionsProps {
  onTriggerSync: () => void;
  onLoadSynthetic: () => void;
  loading?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onTriggerSync,
  onLoadSynthetic,
  loading = false,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Card title="Quick Management Actions" subtitle="Perform common operations, sync indexes, or evaluate deflection AI">
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudSyncRounded />}
            onClick={onTriggerSync}
            loading={loading}
            sx={{ px: 2.5, py: 1 }}
          >
            Trigger Incremental Sync
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<PsychologyRounded />}
            onClick={() => navigate('/suggestions')}
            sx={{ px: 2, py: 1 }}
          >
            Test AI Deflection
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ScienceRounded />}
            onClick={onLoadSynthetic}
            loading={loading}
            sx={{ px: 2, py: 1 }}
          >
            Load Synthetic Knowledge Data
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<UploadFileRounded />}
            onClick={() => navigate('/files')}
            sx={{ px: 2, py: 1 }}
          >
            Upload Documents
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<SearchRounded />}
            onClick={() => navigate('/knowledge')}
            sx={{ px: 2, py: 1 }}
          >
            Explore Knowledge Base
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          Execute background tasks, populate vector embeddings, or evaluate Pre-Ticket Deflection models instantly.
        </Typography>
      </Stack>
    </Card>
  );
};

