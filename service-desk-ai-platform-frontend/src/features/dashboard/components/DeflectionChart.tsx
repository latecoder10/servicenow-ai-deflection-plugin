import React from 'react';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LineChart } from '../../../components/charts/LineChart';
import { Box, Typography } from '@mui/material';
import { ShowChartRounded } from '../../../icons';

export const DeflectionChart: React.FC = () => {
  return (
    <Card
      title="AI Deflection Trend"
      subtitle="Percentage of incident queries successfully resolved before ticket creation"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ pt: 1, flexGrow: 1, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon={<ShowChartRounded sx={{ fontSize: 48, color: '#a0aec0' }} />}
          title="No trend data available"
          description="Deflection trend data will appear here once enough incidents have been processed by the AI engine."
        />
      </Box>
    </Card>
  );
};
