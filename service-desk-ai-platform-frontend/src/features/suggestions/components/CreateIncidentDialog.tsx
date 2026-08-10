import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { TextField, Grid, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { CreateIncidentRequest } from '../../../types/incident';

export interface CreateIncidentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIncidentRequest) => void;
  loading?: boolean;
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: string;
  initialEmail?: string;
}

export const CreateIncidentDialog: React.FC<CreateIncidentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialTitle = '',
  initialDescription = '',
  initialCategory = 'IT Security',
  initialEmail = 'ayan.estspace@gmail.com',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [callerEmail, setCallerEmail] = useState(initialEmail);
  const [category, setCategory] = useState(initialCategory);
  const [priority, setPriority] = useState('3');
  const [assignedGroup, setAssignedGroup] = useState('Service Desk L2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      callerEmail,
      category,
      priority,
      assignedGroup,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create ServiceNow Support Incident"
      actions={
        <>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" loading={loading}>
            Create Incident
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Incident Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={3}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Caller Email"
              value={callerEmail}
              onChange={(e) => setCallerEmail(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="IT Security">IT Security</MenuItem>
                <MenuItem value="Network & VPN">Network & VPN</MenuItem>
                <MenuItem value="Software">Software</MenuItem>
                <MenuItem value="Hardware">Hardware</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                <MenuItem value="1">P1 - Critical</MenuItem>
                <MenuItem value="2">P2 - High</MenuItem>
                <MenuItem value="3">P3 - Moderate</MenuItem>
                <MenuItem value="4">P4 - Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Assigned Group"
              value={assignedGroup}
              onChange={(e) => setAssignedGroup(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
};

