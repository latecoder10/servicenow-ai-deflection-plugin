import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { FormControl, InputLabel, Select, MenuItem, TextField, Box, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { SyncRequest } from '../../../types/connector';

export interface SyncTriggerDialogProps {
  open: boolean;
  connectorType: string | null;
  onClose: () => void;
  onSubmit: (connectorType: string, request: SyncRequest) => void;
  loading?: boolean;
}

export const SyncTriggerDialog: React.FC<SyncTriggerDialogProps> = ({
  open,
  connectorType,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [syncType, setSyncType] = useState<'INCREMENTAL' | 'FULL'>('INCREMENTAL');
  const [limit, setLimit] = useState<number>(50);
  const [forceEmbeddingsReindex, setForceEmbeddingsReindex] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectorType) return;
    onSubmit(connectorType, {
      syncType,
      limit,
      forceEmbeddingsReindex,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Initiate Synchronisation: ${connectorType || ''}`}
      actions={
        <>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" loading={loading}>
            Start Sync Job
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body2" sx={{ color: '#586069' }}>
          Execute pipeline extraction for source {connectorType}. Extracted records will be cleaned, embedded via Google Gemini text-embedding-004, and stored in Pinecone.
        </Typography>

        <FormControl fullWidth size="small">
          <InputLabel>Synchronization Type</InputLabel>
          <Select
            value={syncType}
            label="Synchronization Type"
            onChange={(e) => setSyncType(e.target.value as 'INCREMENTAL' | 'FULL')}
          >
            <MenuItem value="INCREMENTAL">INCREMENTAL (Only changed records since last run)</MenuItem>
            <MenuItem value="FULL">FULL (Re-query and extract all records)</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Maximum Record Batch Limit"
          type="number"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10) || 50)}
          size="small"
          fullWidth
          helperText="Limit total records extracted during this run (1 - 500)"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={forceEmbeddingsReindex}
              onChange={(e) => setForceEmbeddingsReindex(e.target.checked)}
              color="primary"
            />
          }
          label="Force regenerated Pinecone vector embeddings for existing records"
        />
      </Box>
    </Modal>
  );
};
