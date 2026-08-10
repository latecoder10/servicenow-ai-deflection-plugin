import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

export interface StepByStepViewProps {
  steps: string[];
}

export const StepByStepView: React.FC<StepByStepViewProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#24292e', mb: 1.5 }}>
        Step-by-Step Resolution Steps
      </Typography>
      <Stack spacing={1.25}>
        {steps.map((step, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 1.5,
              backgroundColor: '#fafbfc',
              border: '1px solid #e1e4e8',
              borderRadius: '6px',
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#0366d6',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              {idx + 1}
            </Box>
            <Typography variant="body2" sx={{ color: '#24292e', lineHeight: 1.6 }}>
              {step}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
