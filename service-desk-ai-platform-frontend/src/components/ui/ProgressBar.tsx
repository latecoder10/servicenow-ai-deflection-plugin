import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

export interface ProgressBarProps {
  value: number;
  label?: string;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  height?: number;
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color = 'primary',
  height = 8,
  showPercent = true,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <Box sx={{ width: '100%' }}>
      {(label || showPercent) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          {label && (
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#586069' }}>
              {label}
            </Typography>
          )}
          {showPercent && (
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#24292e' }}>
              {`${Math.round(clamped)}%`}
            </Typography>
          )}
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={clamped}
        color={color}
        sx={{
          height,
          borderRadius: height / 2,
          backgroundColor: '#e1e4e8',
        }}
      />
    </Box>
  );
};
