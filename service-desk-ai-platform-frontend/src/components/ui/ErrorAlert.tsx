import React from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { ProblemDetails } from '../../types/common';

export interface ErrorAlertProps {
  error?: ProblemDetails | string | null;
  onClose?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose }) => {
  if (!error) return null;

  if (typeof error === 'string') {
    return (
      <Alert severity="error" onClose={onClose} sx={{ mb: 2, borderRadius: '6px' }}>
        {error}
      </Alert>
    );
  }

  return (
    <Alert severity="error" onClose={onClose} sx={{ mb: 2, borderRadius: '6px' }}>
      <AlertTitle sx={{ fontWeight: 600 }}>{error.title || 'Error'}</AlertTitle>
      <Typography variant="body2">{error.detail}</Typography>
      {error.correlationId && (
        <Box sx={{ mt: 0.5, opacity: 0.75, fontSize: '0.725rem', fontFamily: 'monospace' }}>
          Correlation ID: {error.correlationId}
        </Box>
      )}
    </Alert>
  );
};
