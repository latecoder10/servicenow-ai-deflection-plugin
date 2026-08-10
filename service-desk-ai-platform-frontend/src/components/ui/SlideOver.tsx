import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material';
import { CloseRounded } from '../../icons';

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  width?: number | string;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  open,
  onClose,
  title,
  children,
  width = 480,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: width },
          boxSizing: 'border-box',
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid #e1e4e8',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#24292e', fontSize: '1.1rem' }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#586069' }}>
          <CloseRounded />
        </IconButton>
      </Box>

      {/* Body Content */}
      <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>{children}</Box>
    </Drawer>
  );
};
