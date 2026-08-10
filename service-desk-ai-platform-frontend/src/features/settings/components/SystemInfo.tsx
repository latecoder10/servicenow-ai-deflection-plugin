import React from 'react';
import { Card } from '../../../components/ui/Card';
import { HealthResponse } from '../../../types/health';
import { Box, Typography, Grid, Divider } from '@mui/material';
import { APP_NAME, APP_VERSION } from '../../../config/constants';

export interface SystemInfoProps {
  health: HealthResponse | null;
}

export const SystemInfo: React.FC<SystemInfoProps> = ({ health }) => {
  return (
    <Card title="System Environment & Configuration Details">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Application Name:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {health?.service || APP_NAME}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                System Version:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                {health?.version || APP_VERSION}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Runtime Platform:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Spring Boot 3.4 / Java 17
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                UI Framework:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                React 19 + Vite 6 + MUI 9
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Pinecone Index:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                servicedesk-knowledge
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                AI Model:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                gemini-3.6-flash
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Platform Status:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: health?.status === 'UP' ? 'success.main' : 'error.main', fontFamily: 'monospace' }}>
                {health?.status || 'UNKNOWN'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Health Timestamp:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Built in accordance with RFC-7807 problem details specification, standard REST error handlers, and enterprise security logging protocols.
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};
