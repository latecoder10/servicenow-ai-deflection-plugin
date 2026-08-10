import React from 'react';
import { Box, Card, Typography, useTheme } from '@mui/material';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor,
  iconColor = '#0366d6',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const defaultBgColor = iconBgColor || (isDark ? 'rgba(3, 102, 214, 0.2)' : '#e6f0ff');

  return (
    <Card
      sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: 110,
        boxSizing: 'border-box',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: isDark ? '#444c56' : '#d0d7de',
        },
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <Box>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 0.75 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.75, fontSize: '1.75rem', lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        {(subtitle || trend) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {trend && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: trend.isPositive !== false ? (isDark ? '#56d364' : '#1e7e34') : (isDark ? '#f85149' : '#d73a49'),
                  backgroundColor: trend.isPositive !== false
                    ? (isDark ? 'rgba(46, 160, 67, 0.2)' : '#e6f4ea')
                    : (isDark ? 'rgba(248, 81, 73, 0.2)' : '#ffeef0'),
                  px: 1,
                  py: 0.3,
                  borderRadius: '4px',
                  fontSize: '0.725rem',
                  lineHeight: 1,
                }}
              >
                {trend.value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {icon && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            backgroundColor: defaultBgColor,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: 2,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
    </Card>
  );
};

