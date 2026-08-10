import React from 'react';
import { Card } from '../../../components/ui/Card';
import { StatusChip } from '../../../components/ui/StatusChip';
import { HealthResponse } from '../../../types/health';
import { ServiceNowHealthResponse } from '../../../api/apiServiceNow';
import { Box, Typography, Grid, Paper } from '@mui/material';

export interface HealthStatusProps {
  health: HealthResponse | null;
  serviceNowHealth: ServiceNowHealthResponse | null;
}

export const HealthStatus: React.FC<HealthStatusProps> = ({ health, serviceNowHealth }) => {
  const overallStatus = health?.status || 'UNKNOWN';

  return (
    <Card
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.1rem' }}>
            System Infrastructure & Service Connectivity
          </Typography>
          <StatusChip status={overallStatus} />
        </Box>
      }
      sx={{ mb: 3 }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Platform Health
              </Typography>
              <StatusChip status={health?.status || 'UNKNOWN'} />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Service: {health?.service || 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Version: {health?.version || 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Pinecone Vector DB
              </Typography>
              <StatusChip status={health?.pineconeStatus || 'UNKNOWN'} />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Index: servicedesk-knowledge
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Dimensions: 1024
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                ServiceNow API
              </Typography>
              <StatusChip status={serviceNowHealth?.status || health?.servicenowStatus || 'UNKNOWN'} />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Instance: {serviceNowHealth?.instance || 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Auth: {serviceNowHealth?.authMode || 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: '6px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                AI Engine
              </Typography>
              <StatusChip status="CONNECTED" />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Model: gemini-3.6-flash
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Embeddings: gemini-embedding-001
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Card>
  );
};
