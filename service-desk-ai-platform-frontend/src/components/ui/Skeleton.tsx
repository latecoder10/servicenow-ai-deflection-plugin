import React from 'react';
import { Skeleton as MuiSkeleton, Box, Card, CardContent } from '@mui/material';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 1, borderBottom: '1px solid #e1e4e8' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <MuiSkeleton key={i} variant="rectangular" height={24} sx={{ flex: 1, borderRadius: '4px' }} />
        ))}
      </Box>
      {Array.from({ length: rows }).map((_, r) => (
        <Box key={r} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          {Array.from({ length: columns }).map((_, c) => (
            <MuiSkeleton key={c} variant="text" height={20} sx={{ flex: 1 }} />
          ))}
        </Box>
      ))}
    </Box>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <Card sx={{ border: '1px solid #e1e4e8' }}>
      <CardContent sx={{ p: 2.5 }}>
        <MuiSkeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
        <MuiSkeleton variant="rectangular" height={60} sx={{ borderRadius: '6px', mb: 1 }} />
        <MuiSkeleton variant="text" width="40%" height={20} />
      </CardContent>
    </Card>
  );
};
