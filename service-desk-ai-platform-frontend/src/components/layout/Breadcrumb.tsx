import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRightRounded } from '../../icons';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatName = (str: string) => {
    return str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (pathnames.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs separator={<ChevronRightRounded sx={{ fontSize: 16, color: '#8b949e' }} />}>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate('/dashboard')}
          sx={{ cursor: 'pointer', fontSize: '0.8125rem', color: '#586069' }}
        >
          Home
        </Link>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return isLast ? (
            <Typography key={name} sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#24292e' }}>
              {formatName(name)}
            </Typography>
          ) : (
            <Link
              key={name}
              underline="hover"
              color="inherit"
              onClick={() => navigate(routeTo)}
              sx={{ cursor: 'pointer', fontSize: '0.8125rem', color: '#586069' }}
            >
              {formatName(name)}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};
