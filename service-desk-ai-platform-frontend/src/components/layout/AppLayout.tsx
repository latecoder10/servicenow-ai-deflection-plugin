import React from 'react';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Breadcrumb } from './Breadcrumb';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { useAppStore } from '../../stores/appStore';
import { createAppTheme } from '../../config/theme';

export const AppLayout: React.FC = () => {
  const { themeMode } = useAppStore();
  const theme = createAppTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={4} autoHideDuration={4000}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
          {/* Top Bar Navigation */}
          <TopBar />

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              mt: '64px',
              width: '100%',
              minHeight: 'calc(100vh - 64px)',
            }}
          >
            <Container
              maxWidth={false}
              sx={{
                maxWidth: 1400,
                mx: 'auto',
                p: '0 !important',
              }}
            >
              <Breadcrumb />
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </Container>
          </Box>
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  );
};
