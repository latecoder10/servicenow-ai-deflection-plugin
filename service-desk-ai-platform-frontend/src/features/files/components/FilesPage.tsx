import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useFiles } from '../hooks/useFiles';
import { FileUploadZone } from './FileUploadZone';
import { UploadProgress } from './UploadProgress';
import { FilesTable } from './FilesTable';
import { FileDetail } from './FileDetail';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { KnowledgeDocumentEntity } from '../../../types/file';
import { RefreshRounded } from '../../../icons';

export const FilesPage: React.FC = () => {
  const {
    files,
    loading,
    uploading,
    uploadProgress,
    error,
    fetchFiles,
    uploadFile,
  } = useFiles();

  const [selectedFile, setSelectedFile] = useState<KnowledgeDocumentEntity | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  const handleViewDetail = (file: KnowledgeDocumentEntity) => {
    setSelectedFile(file);
    setDetailOpen(true);
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.5rem' }}>
            Knowledge Document Upload
          </Typography>
          <Typography variant="body2" sx={{ color: '#586069' }}>
            Upload manuals, SOPs, and architecture specifications to index into Pinecone for AI deflection
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshRounded />}
          onClick={fetchFiles}
          disabled={loading}
        >
          Refresh Files
        </Button>
      </Box>

      <ErrorAlert error={error} />

      {/* Active Upload Progress */}
      {uploading && <UploadProgress progress={uploadProgress} />}

      {/* Upload Dropzone */}
      <Box sx={{ mb: 4 }}>
        <FileUploadZone onUpload={uploadFile} uploading={uploading} />
      </Box>

      {/* Files Table */}
      <FilesTable
        files={files}
        loading={loading}
        onViewDetail={handleViewDetail}
      />

      {/* Detail Slide-over */}
      <FileDetail
        file={selectedFile}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
};
