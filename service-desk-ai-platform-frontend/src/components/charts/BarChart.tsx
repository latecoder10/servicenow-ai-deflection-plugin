import React from 'react';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box } from '@mui/material';

export interface BarChartDataPoint {
  name: string;
  [key: string]: any;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  dataKey: string;
  color?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  color = '#2196f3',
  height = 280,
}) => {
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" />
          <XAxis dataKey="name" stroke="#586069" fontSize={12} tickLine={false} />
          <YAxis stroke="#586069" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e4e8',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </Box>
  );
};
