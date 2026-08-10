import React from 'react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Box } from '@mui/material';

export interface DonutDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutDataPoint[];
  height?: number;
}

const DEFAULT_COLORS = ['#0366d6', '#28a745', '#f9a825', '#d73a49', '#6f42c1'];

export const DonutChart: React.FC<DonutChartProps> = ({ data, height = 280 }) => {
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e4e8',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </RechartsPieChart>
      </ResponsiveContainer>
    </Box>
  );
};
