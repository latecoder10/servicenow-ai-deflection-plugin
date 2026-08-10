import React from 'react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box, useTheme } from '@mui/material';

export interface LineChartDataPoint {
  name: string;
  [key: string]: any;
}

export interface LineChartProps {
  data: LineChartDataPoint[];
  dataKey: string;
  color?: string;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  color,
  height = 280,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const lineColor = color || (isDark ? '#58a6ff' : '#0366d6');
  const gridColor = isDark ? '#30363d' : '#e1e4e8';
  const textColor = isDark ? '#8b949e' : '#586069';

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} />
          <YAxis stroke={textColor} fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#161b22' : '#ffffff',
              border: `1px solid ${gridColor}`,
              borderRadius: '6px',
              fontSize: '12px',
              color: isDark ? '#f0f6fc' : '#24292e',
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ r: 4, fill: lineColor }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
};

