import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export interface BadgeProps extends ChipProps {
  variantStyle?: 'default' | 'outline' | 'subtle';
}

export const Badge: React.FC<BadgeProps> = ({ variantStyle = 'subtle', color = 'primary', sx, ...props }) => {
  return (
    <Chip
      size="small"
      color={color}
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '4px',
        height: '22px',
        ...sx,
      }}
      {...props}
    />
  );
};
