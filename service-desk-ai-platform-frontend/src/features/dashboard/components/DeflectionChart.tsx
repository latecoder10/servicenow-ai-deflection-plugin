import React, { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Skeleton, Alert } from '@mui/material';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import { ShowChartRounded } from '../../../icons';
import { apiGetDeflectionTrend } from '../../../api/apiAnalytics';
import { DeflectionTrendResponse } from '../../../types/analytics';
import { ProblemDetails } from '../../../types/common';

/**
 * Deflection rate over time, from recorded telemetry.
 *
 * Two series rather than one. "Offered" is what the engine answered above its
 * confidence threshold; "Confirmed" is what an agent then said actually solved the
 * problem. Plotting only the first would flatter the platform, because a confident
 * wrong answer counts towards it and nothing corrects for that.
 */
export const DeflectionChart: React.FC = () => {
  const [granularity, setGranularity] = useState<'DAY' | 'HOUR'>('DAY');
  const [data, setData] = useState<DeflectionTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProblemDetails | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: result, error: err } = await apiGetDeflectionTrend(30, granularity);
    if (err) {
      setError(err);
      setData(null);
    } else {
      setData(result);
      setError(null);
    }
    setLoading(false);
  }, [granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  // A day bucket wants a date; an hour bucket wants a clock time. Showing the full
  // ISO string on either axis is unreadable at this width.
  const label = (bucket: string) => {
    const date = new Date(bucket);
    if (Number.isNaN(date.getTime())) return bucket;
    return granularity === 'HOUR'
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const chartData = (data?.points ?? []).map((point) => ({
    name: label(point.bucket),
    Offered: point.deflectionRatePercent,
    Confirmed: point.confirmedRatePercent,
    queries: point.queries,
  }));

  const granularityToggle = (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={granularity}
      onChange={(_, next) => next && setGranularity(next)}
    >
      <ToggleButton value="DAY" sx={{ px: 1.5, fontSize: '0.7rem' }}>Daily</ToggleButton>
      <ToggleButton value="HOUR" sx={{ px: 1.5, fontSize: '0.7rem' }}>Hourly</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <Card
      title="AI Deflection Trend"
      subtitle="Percentage of incident queries successfully resolved before ticket creation"
      action={granularityToggle}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ pt: 1, flexGrow: 1, minHeight: 220 }}>
        {loading && <Skeleton variant="rectangular" height={240} />}

        {!loading && error && <ErrorAlert error={error} />}

        {!loading && !error && chartData.length === 0 && (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState
              icon={<ShowChartRounded sx={{ fontSize: 48, color: '#a0aec0' }} />}
              title="No trend data available"
              description="Deflection trend data will appear here once the AI engine has processed some incidents."
            />
          </Box>
        )}

        {!loading && !error && chartData.length > 0 && (
          <>
            {/* One bucket is a dot, not a trend. Saying so stops a reader concluding
                the chart is broken when the data is simply young. */}
            {!data?.sufficientForTrend && (
              <Alert severity="info" sx={{ mb: 1.5, py: 0.25 }}>
                Only one {granularity === 'HOUR' ? 'hour' : 'day'} of telemetry so far.
                {granularity === 'DAY' && ' Switch to Hourly to see today in more detail.'}
              </Alert>
            )}

            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" />
                  <XAxis dataKey="name" stroke="#586069" fontSize={12} tickLine={false} />
                  <YAxis stroke="#586069" fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e1e4e8',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Offered" stroke="#0366d6" strokeWidth={2.5}
                        dot={{ r: 4, fill: '#0366d6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Confirmed" stroke="#28a745" strokeWidth={2.5}
                        dot={{ r: 4, fill: '#28a745' }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </Box>

            <Typography variant="caption" sx={{ color: '#586069', display: 'block', mt: 1 }}>
              Offered: answered above the confidence threshold. Confirmed: an agent said it
              solved the problem. Across {data?.pointCount ?? 0}{' '}
              {granularity === 'HOUR' ? 'hour' : 'day'}
              {(data?.pointCount ?? 0) === 1 ? '' : 's'}.
            </Typography>
          </>
        )}
      </Box>
    </Card>
  );
};
