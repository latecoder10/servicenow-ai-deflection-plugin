import React from 'react';
import { Card as MuiCard, CardContent, CardHeader, CardProps as MuiCardProps, Box, Typography } from '@mui/material';

export interface CardProps extends MuiCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, noPadding, sx, ...props }) => {
  return (
    <MuiCard
      sx={{
        overflow: 'hidden',
        border: '1px solid #e1e4e8',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderRadius: '6px',
        ...sx,
      }}
      {...props}
    >
      {(title || subtitle || action) && (
        <CardHeader
          title={
            typeof title === 'string' ? (
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#24292e' }}>
                {title}
              </Typography>
            ) : (
              title
            )
          }
          subheader={subtitle}
          action={action}
          sx={{ pb: children ? 1 : 2, pt: 2, px: 2.5 }}
        />
      )}
      <CardContent sx={{ p: noPadding ? 0 : 2.5, '&:last-child': { pb: noPadding ? 0 : 2.5 } }}>
        {children}
      </CardContent>
    </MuiCard>
  );
};
