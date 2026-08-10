import React from 'react';
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from '@mui/material';

export interface TooltipProps extends MuiTooltipProps {
  content?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ title, content, children, ...props }) => {
  return (
    <MuiTooltip title={title || content || ''} arrow {...props}>
      {children}
    </MuiTooltip>
  );
};
