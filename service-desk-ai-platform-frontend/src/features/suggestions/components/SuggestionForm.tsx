import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box,
} from '@mui/material';
import { ResolveIncidentRequest } from '../../../types/suggestion';
import { validateTitle, validateDescription, validateEmail } from '../../../utils/validators';
import { AutoAwesomeRounded, PsychologyRounded } from '../../../icons';

export interface SuggestionFormProps {
  onSubmit: (data: ResolveIncidentRequest) => void;
  loading?: boolean;
}

export const SuggestionForm: React.FC<SuggestionFormProps> = ({ onSubmit, loading = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [callerEmail, setCallerEmail] = useState('ayan.estspace@gmail.com');
  const [userDepartment, setUserDepartment] = useState('Enterprise IT');
  const [category, setCategory] = useState('IT Security');
  const [minConfidenceThreshold, setMinConfidenceThreshold] = useState(75);

  const [errors, setErrors] = useState<{ title?: string; description?: string; email?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const titleVal = validateTitle(title);
    const descVal = validateDescription(description);
    const emailVal = validateEmail(callerEmail);

    const newErrors: { title?: string; description?: string; email?: string } = {};

    if (!titleVal.valid) newErrors.title = titleVal.error;
    if (!descVal.valid) newErrors.description = descVal.error;
    if (!emailVal) newErrors.email = 'Invalid email address.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      title,
      description,
      callerEmail: callerEmail || undefined,
      userDepartment: userDepartment || undefined,
      category: category || undefined,
      minConfidenceThreshold,
    });
  };

  const handlePresetSample = (presetTitle: string, presetDesc: string, presetCat: string) => {
    setTitle(presetTitle);
    setDescription(presetDesc);
    setCategory(presetCat);
  };

  return (
    <Card
      title="Submit Incident Query for AI Resolution"
      subtitle="Google Gemini 3.6 Flash queries Pinecone vector indices to propose automated pre-ticket deflection"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2.5}>
          {/* Sample Prompts */}
          <Grid size={12}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#586069', display: 'block', mb: 1 }}>
              Quick Test Presets:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() =>
                  handlePresetSample(
                    'VPN Connection Failing with Auth Error 800',
                    'Cannot connect to Enterprise Cisco AnyConnect VPN from home network. Receiving authentication handshake failure Error 800.',
                    'Network & VPN'
                  )
                }
              >
                VPN Error 800
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() =>
                  handlePresetSample(
                    'Reset Okta SSO MFA Security Token',
                    'Lost access to mobile authenticator app. Need to reset 2FA registration for company Okta portal.',
                    'IT Security'
                  )
                }
              >
                Reset Okta MFA
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() =>
                  handlePresetSample(
                    'Request JetBrains IntelliJ Ultimate License',
                    'Software engineering project requires IntelliJ IDEA Ultimate license key assigned to my employee profile.',
                    'Software'
                  )
                }
              >
                IntelliJ License Request
              </Button>
            </Box>
          </Grid>

          {/* Title */}
          <Grid size={12}>
            <TextField
              label="Incident Title / Summary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={Boolean(errors.title)}
              helperText={errors.title || 'Required (3-250 characters)'}
              required
              fullWidth
              size="small"
              placeholder="e.g. Cannot establish Cisco VPN connection from remote network"
            />
          </Grid>

          {/* Description */}
          <Grid size={12}>
            <TextField
              label="Detailed Description & Error Output"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={Boolean(errors.description)}
              helperText={errors.description || 'Describe symptoms, error codes, and steps tried'}
              required
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="e.g. Attempted connecting to vpn.company.com via GlobalProtect. Client hangs at 98% then displays Gateway Unreachable."
            />
          </Grid>

          {/* Caller Email & Dept */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Caller Email"
              value={callerEmail}
              onChange={(e) => setCallerEmail(e.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select value={userDepartment} label="Department" onChange={(e) => setUserDepartment(e.target.value)}>
                <MenuItem value="Enterprise IT">Enterprise IT</MenuItem>
                <MenuItem value="Software Engineering">Software Engineering</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="Human Resources">Human Resources</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Category & Threshold */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="IT Security">IT Security</MenuItem>
                <MenuItem value="Network & VPN">Network & VPN</MenuItem>
                <MenuItem value="Software">Software</MenuItem>
                <MenuItem value="Hardware">Hardware</MenuItem>
                <MenuItem value="Access Management">Access Management</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#586069' }}>
                Deflection Confidence Threshold: {minConfidenceThreshold}%
              </Typography>
              <Slider
                value={minConfidenceThreshold}
                min={50}
                max={95}
                onChange={(_, val) => setMinConfidenceThreshold(val as number)}
                size="small"
                valueLabelDisplay="auto"
              />
            </Box>
          </Grid>

          {/* Submit Button */}
          <Grid size={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<AutoAwesomeRounded />}
              loading={loading}
              fullWidth
            >
              Evaluate AI Pre-Ticket Deflection
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
};
