import React from 'react';
import { Box, Typography } from '@mui/material';

export interface ConfidenceBadgeProps {
  score: number; // 0-100
  band?: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, band }) => {
  let color = '#d73a49'; // Red / LOW
  let bg = '#ffeef0';
  let bandLabel = 'Low Confidence';

  if (score >= 90 || band === 'VERY_HIGH') {
    color = '#28a745';
    bg = '#e6f4ea';
    bandLabel = 'Very High Confidence';
  } else if (score >= 75 || band === 'HIGH') {
    color = '#0366d6';
    bg = '#ddf4ff';
    bandLabel = 'High Confidence';
  } else if (score >= 50 || band === 'MEDIUM') {
    color = '#b08800';
    bg = '#fff8c5';
    bandLabel = 'Medium Confidence';
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: '16px',
        backgroundColor: bg,
        border: `1px solid ${color}44`,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: '0.8125rem' }}>
        {score}% • {bandLabel}
      </Typography>
    </Box>
  );
};
