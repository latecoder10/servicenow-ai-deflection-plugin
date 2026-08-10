import React, { useId } from 'react';
import { Box, Typography } from '@mui/material';

export interface AppLogoProps {
  height?: number | string;
  className?: string;
  mode?: 'dark' | 'light';
  variant?: 'full' | 'icon' | 'mark' | 'svg-full';
  style?: React.CSSProperties;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  height = 36,
  className,
  mode = 'dark',
  variant = 'full',
  style,
}) => {
  const uniqueId = useId().replace(/:/g, '');
  const aiGradId = `ai-grad-${uniqueId}`;
  const botGradId = `bot-grad-${uniqueId}`;

  const numHeight = typeof height === 'number' ? height : parseInt(String(height), 10) || 36;

  // Gradients definition block
  const Gradients = () => (
    <defs>
      <linearGradient id={aiGradId} x1="20" y1="260" x2="170" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06B6D4" />
        <stop offset="0.55" stopColor="#2563EB" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id={botGradId} x1="450" y1="55" x2="650" y2="245" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2563EB" />
        <stop offset="1" stopColor="#4338CA" />
      </linearGradient>
    </defs>
  );

  // Mark 1: AI monogram
  const AiMonogram = () => (
    <g transform="translate(40, 52)">
      <path d="M18 188L72 28C76 16 88 8 101 8H125L181 188H143L130 145H69L56 188H18ZM78 112H121L100 43L78 112Z" fill={`url(#${aiGradId})`} />
      <rect x="187" y="8" width="34" height="180" rx="17" fill={`url(#${aiGradId})`} />
      <circle cx="16" cy="167" r="7" fill="#2563EB" />
      <circle cx="3" cy="145" r="5" fill="#06B6D4" />
      <circle cx="30" cy="188" r="5" fill="#6366F1" />
    </g>
  );

  // Mark 2: Headset Bot
  const HeadsetBot = () => (
    <g transform="translate(325, 42)">
      <path d="M35 108C35 48 84 5 145 5C206 5 255 48 255 108" stroke={`url(#${botGradId})`} strokeWidth="18" strokeLinecap="round" />
      <rect x="25" y="92" width="48" height="82" rx="22" fill={`url(#${botGradId})`} />
      <rect x="217" y="92" width="48" height="82" rx="22" fill={`url(#${botGradId})`} />
      <path d="M71 105C71 72 101 49 145 49C189 49 219 72 219 105V160C219 192 190 214 145 214C100 214 71 192 71 160V105Z" fill="white" stroke="#D0D5DD" strokeWidth="4" />
      <path d="M91 104C91 82 113 67 145 67C177 67 199 82 199 104V151C199 173 177 187 145 187C113 187 91 173 91 151V104Z" fill="#0F172A" />
      <rect x="119" y="106" width="12" height="28" rx="6" fill="#22D3EE" />
      <rect x="159" y="106" width="12" height="28" rx="6" fill="#22D3EE" />
      <path d="M187 176C207 173 224 159 230 141" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" />
      <rect x="214" y="158" width="43" height="18" rx="9" fill="#2563EB" />
      <path d="M255 78L266 67L277 78L266 89L255 78Z" fill="#6366F1" />
    </g>
  );

  // Single Headset Bot Icon
  if (variant === 'icon') {
    return (
      <svg
        viewBox="340 40 270 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: numHeight, width: 'auto', display: 'block', ...style }}
        className={className}
      >
        <Gradients />
        <HeadsetBot />
      </svg>
    );
  }

  // Single Headset Bot Mark
  const SingleBotMark = (
    <svg
      viewBox="340 40 270 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: numHeight, width: 'auto', display: 'block' }}
    >
      <Gradients />
      <HeadsetBot />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <Box style={style} className={className}>
        {SingleBotMark}
      </Box>
    );
  }

  if (variant === 'svg-full') {
    return (
      <svg
        viewBox="340 40 810 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: numHeight, width: 'auto', display: 'block', ...style }}
        className={className}
      >
        <Gradients />
        <HeadsetBot />
        <text
          x="620"
          y="150"
          fill={mode === 'dark' ? '#ffffff' : '#101828'}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="64"
          fontWeight="800"
          letterSpacing="-1"
        >
          Service Desk
        </text>
        <text
          x="622"
          y="195"
          fill="#38bdf8"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="20"
          fontWeight="700"
          letterSpacing="3"
        >
          AI-POWERED SUPPORT
        </text>
      </svg>
    );
  }

  // Default 'full': Headset Bot SVG emblem + sharp, responsive HTML typography
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        userSelect: 'none',
        lineHeight: 1,
        ...style,
      }}
      className={className}
    >
      {SingleBotMark}
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: mode === 'dark' ? '#ffffff' : '#0f172a',
            fontSize: numHeight >= 36 ? '1.05rem' : '0.95rem',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          Service Desk
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: '#38bdf8',
            fontSize: numHeight >= 36 ? '0.625rem' : '0.55rem',
            lineHeight: 1.2,
            letterSpacing: '0.12em',
            mt: '2px',
            textTransform: 'uppercase',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          AI-POWERED SUPPORT
        </Typography>
      </Box>
    </Box>
  );
};
