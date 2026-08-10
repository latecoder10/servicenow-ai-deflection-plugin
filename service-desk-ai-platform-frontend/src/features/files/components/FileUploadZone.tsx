import React, { useRef, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Box, Typography, Button } from '@mui/material';
import { CloudUploadRounded, DescriptionRounded } from '../../../icons';

export interface FileUploadZoneProps {
  onUpload: (file: File) => void;
  uploading?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onUpload, uploading = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card
      title="Upload Knowledge Document to Vector Store"
      subtitle="Supported formats: PDF, DOCX, XLSX, CSV, TXT, Markdown (Max 100MB per file)"
    >
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 4,
          border: `2px dashed ${dragOver ? '#0366d6' : '#d0d7de'}`,
          borderRadius: '8px',
          backgroundColor: dragOver ? '#ddf4ff' : '#fafbfc',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#0366d6',
            backgroundColor: '#f6f8fa',
          },
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".pdf,.docx,.xlsx,.txt,.csv,.md"
        />
        <CloudUploadRounded sx={{ fontSize: 48, color: '#0366d6', mb: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#24292e' }}>
          Drag and drop your knowledge document here, or click to browse
        </Typography>
        <Typography variant="body2" sx={{ color: '#586069', mt: 0.5 }}>
          Uploaded files will be automatically parsed, chunked, embedded via Gemini, and indexed into Pinecone.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<DescriptionRounded />}
          sx={{ mt: 2 }}
          disabled={uploading}
        >
          {uploading ? 'Processing File...' : 'Select File'}
        </Button>
      </Box>
    </Card>
  );
};
