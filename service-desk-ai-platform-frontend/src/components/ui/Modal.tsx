import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography, Box } from '@mui/material';
import { CancelRounded } from '../../icons';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          {title}
        </Typography>
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CancelRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2.5 }}>
        {children}
      </DialogContent>
      {actions && <DialogActions sx={{ p: 2 }}>{actions}</DialogActions>}
    </Dialog>
  );
};
