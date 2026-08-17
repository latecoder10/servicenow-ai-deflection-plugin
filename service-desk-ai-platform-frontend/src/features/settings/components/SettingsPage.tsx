import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useHealth } from '../hooks/useHealth';
import { HealthStatus } from './HealthStatus';
import { SystemInfo } from './SystemInfo';
import { PlatformConfiguration } from './PlatformConfiguration';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { RefreshRounded } from '../../../icons';

export const SettingsPage: React.FC = () => {
  const { health, serviceNowHealth, loading, error, refreshHealth } = useHealth();

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.5rem' }}>
            System Settings & Health
          </Typography>
          <Typography variant="body2" sx={{ color: '#586069' }}>
            Monitor platform health, service connectivity, and system configuration
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshRounded />}
          onClick={refreshHealth}
          disabled={loading}
        >
          Refresh Health
        </Button>
      </Box>

      <ErrorAlert error={error} />

      <HealthStatus health={health} serviceNowHealth={serviceNowHealth} />

      <PlatformConfiguration />

      <SystemInfo health={health} />
    </Box>
  );
};
