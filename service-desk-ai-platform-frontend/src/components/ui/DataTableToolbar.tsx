import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SearchInput } from './SearchInput';

export interface DataTableToolbarProps {
  title?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  title,
  searchQuery = '',
  onSearchChange,
  actions,
  searchPlaceholder = 'Filter records...',
}) => {
  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        borderBottom: '1px solid #e1e4e8',
        backgroundColor: '#ffffff',
      }}
    >
      {title ? (
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#24292e' }}>
          {title}
        </Typography>
      ) : (
        <Box />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {onSearchChange && (
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            sx={{ width: { xs: '100%', sm: 260 } }}
          />
        )}
        {actions}
      </Box>
    </Box>
  );
};
