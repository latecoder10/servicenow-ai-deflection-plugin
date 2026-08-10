import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

export interface JobProgressProps {
  status: string;
  itemsCreated?: number;
  itemsFailed?: number;
}

export const JobProgress: React.FC<JobProgressProps> = ({
  status,
  itemsCreated = 0,
  itemsFailed = 0,
}) => {
  let progress = 0;
  let label = 'Initializing';
  let color: 'primary' | 'success' | 'error' | 'warning' = 'primary';

  switch (status) {
    case 'RUNNING':
      progress = 50;
      label = 'Synchronizing...';
      break;
    case 'COMPLETED':
      progress = 100;
      label = `Completed (${itemsCreated} created)`;
      color = 'success';
      break;
    case 'FAILED':
      progress = 100;
      label = itemsFailed > 0 ? `Failed (${itemsFailed} failed)` : 'Failed';
      color = 'error';
      break;
    case 'CANCELLED':
      progress = 100;
      label = 'Cancelled';
      color = 'warning';
      break;
    default:
      progress = 50;
      label = status;
  }

  return (
    <Box sx={{ width: '100%', minWidth: 120 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#586069' }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#24292e' }}>
          {progress}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
};
