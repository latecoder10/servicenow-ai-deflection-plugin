import React from 'react';
import { Grid, Skeleton, useTheme } from '@mui/material';
import { MetricCard } from '../../../components/charts/MetricCard';
import { DeflectionMetrics, DashboardResponse } from '../../../types/analytics';
import { formatNumber, formatPercent, formatCurrency } from '../../../utils/formatters';
import {
  BugReportRounded,
  CheckCircleRounded,
  TrendingUpRounded,
  AutoAwesomeRounded,
} from '../../../icons';

export interface OverviewMetricsProps {
  metrics?: DeflectionMetrics | null;
  dashboard?: DashboardResponse | null;
  loading?: boolean;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ metrics, dashboard, loading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const totalAnalyzed = metrics?.totalIncidentsAnalyzed ?? dashboard?.deflectionMetrics?.totalIncidentsAnalyzed ?? 0;
  const deflectedCount = metrics?.ticketsDeflectedCount ?? dashboard?.deflectionMetrics?.ticketsDeflectedCount ?? 0;
  const deflectionRate = metrics?.deflectionRatePercent ?? dashboard?.deflectionMetrics?.deflectionRatePercent ?? 0;
  const costSavings = metrics?.monthlyCostSavingsUSD ?? dashboard?.deflectionMetrics?.monthlyCostSavingsUSD ?? 0;

  if (loading) {
    return (
      <Grid container spacing={2.5}>
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Skeleton variant="rectangular" height={118} sx={{ borderRadius: '8px' }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Total Incidents Analyzed"
          value={formatNumber(totalAnalyzed)}
          subtitle="Processed by Gemini AI"
          icon={<BugReportRounded sx={{ fontSize: 24 }} />}
          iconBgColor={isDark ? 'rgba(56, 139, 253, 0.2)' : '#e6f0ff'}
          iconColor={isDark ? '#58a6ff' : '#0366d6'}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Tickets Deflected"
          value={formatNumber(deflectedCount)}
          icon={<CheckCircleRounded sx={{ fontSize: 24 }} />}
          iconBgColor={isDark ? 'rgba(46, 160, 67, 0.2)' : '#e6f4ea'}
          iconColor={isDark ? '#56d364' : '#28a745'}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Deflection Rate"
          value={formatPercent(deflectionRate)}
          subtitle="Target threshold: 70.0%"
          icon={<TrendingUpRounded sx={{ fontSize: 24 }} />}
          iconBgColor={isDark ? 'rgba(210, 153, 34, 0.2)' : '#fff8c5'}
          iconColor={isDark ? '#e3b341' : '#b08800'}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Monthly Cost Savings"
          value={formatCurrency(costSavings)}
          subtitle="Estimated support labor saved"
          icon={<AutoAwesomeRounded sx={{ fontSize: 24 }} />}
          iconBgColor={isDark ? 'rgba(188, 140, 255, 0.2)' : '#f3e8ff'}
          iconColor={isDark ? '#d2a8ff' : '#6f42c1'}
        />
      </Grid>
    </Grid>
  );
};
