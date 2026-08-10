import React from 'react';
import { Box, Typography } from '@mui/material';

export interface StatusChipProps {
  status: string;
  label?: string;
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, size = 'small' }) => {
  const normalized = (status || '').toUpperCase();

  let color = '#6c757d'; // Default gray
  let bg = '#f8f9fa';
  let pulse = false;

  if (['COMPLETED', 'CONNECTED', 'READY', 'SUCCESS', 'UP', 'PUBLISHED', 'RESOLVED'].includes(normalized)) {
    color = '#28a745';
    bg = '#e6f4ea';
  } else if (['RUNNING', 'PROCESSING', 'IN_PROGRESS', 'RUNNING'].includes(normalized)) {
    color = '#0366d6';
    bg = '#ddf4ff';
    pulse = true;
  } else if (['FAILED', 'DISCONNECTED', 'ERROR', 'DOWN'].includes(normalized)) {
    color = '#d73a49';
    bg = '#ffeef0';
  } else if (['CANCELLED', 'CLOSED'].includes(normalized)) {
    color = '#586069';
    bg = '#f3f4f6';
  } else if (['PENDING', 'ACCEPTED', 'WARNING'].includes(normalized)) {
    color = '#b08800';
    bg = '#fff8c5';
  } else if (normalized === 'VERY_HIGH') {
    color = '#28a745';
    bg = '#e6f4ea';
  } else if (normalized === 'HIGH') {
    color = '#0366d6';
    bg = '#ddf4ff';
  } else if (normalized === 'MEDIUM') {
    color = '#b08800';
    bg = '#fff8c5';
  } else if (normalized === 'LOW') {
    color = '#d73a49';
    bg = '#ffeef0';
  }

  const displayText = label || status || 'UNKNOWN';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: size === 'small' ? 1.25 : 1.75,
        py: size === 'small' ? 0.35 : 0.6,
        borderRadius: '12px',
        backgroundColor: bg,
        border: `1px solid ${color}33`,
        width: 'fit-content',
      }}
    >
      <Box
        sx={{
          width: size === 'small' ? 7 : 9,
          height: size === 'small' ? 7 : 9,
          borderRadius: '50%',
          backgroundColor: color,
          animation: pulse ? 'pulse 1.5s infinite ease-in-out' : 'none',
          '@keyframes pulse': {
            '0%': { opacity: 1, transform: 'scale(1)' },
            '50%': { opacity: 0.4, transform: 'scale(1.2)' },
            '100%': { opacity: 1, transform: 'scale(1)' },
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color,
          fontSize: size === 'small' ? '0.725rem' : '0.8rem',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {displayText}
      </Typography>
    </Box>
  );
};
