import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SearchRounded } from '../../icons';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <SearchRounded sx={{ fontSize: 48, color: '#a0aec0' }} />,
  title = 'No data available',
  description = 'There are no records matching your query or current filters.',
  action,
}) => {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafbfc',
        borderRadius: '6px',
        border: '1px dashed #e1e4e8',
        my: 2,
      }}
    >
      <Box sx={{ mb: 1.5 }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#24292e', mb: 0.5, fontSize: '1rem' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#586069', maxWidth: 420, mb: action ? 2 : 0 }}>
        {description}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
};
