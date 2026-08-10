import React from 'react';
import { Box, LinearProgress, Typography, Paper } from '@mui/material';

export interface UploadProgressProps {
  progress: number;
  fileName?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progress, fileName = 'Document' }) => {
  return (
    <Paper sx={{ p: 2, mb: 3, border: '1px solid #0366d6', backgroundColor: '#ddf4ff' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0366d6' }}>
          Ingesting and Indexing File: {fileName}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0366d6' }}>
          {progress}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={progress} color="primary" sx={{ height: 8, borderRadius: 4 }} />
      <Typography variant="caption" sx={{ color: '#586069', display: 'block', mt: 1 }}>
        Extracting text chunks → Generating Google Gemini embeddings → Writing vectors to Pinecone index...
      </Typography>
    </Paper>
  );
};
