import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Typography, Box } from '@mui/material';
import { WarningRounded } from '../../icons';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  severity = 'danger',
  loading = false,
}) => {
  const getButtonColor = () => {
    if (severity === 'danger') return 'error';
    if (severity === 'warning') return 'warning';
    return 'primary';
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningRounded sx={{ color: severity === 'danger' ? 'error.main' : 'warning.main' }} />
          <span>{title}</span>
        </Box>
      }
      actions={
        <>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant="contained" color={getButtonColor()} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {message}
      </Typography>
    </Modal>
  );
};
