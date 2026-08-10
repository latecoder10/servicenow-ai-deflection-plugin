import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode: 'light' | 'dark' = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#0366d6',
        light: '#2196f3',
        dark: '#004085',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#6f42c1',
        light: '#8a63d2',
        dark: '#4c2889',
      },
      success: {
        main: '#28a745',
        light: '#34d058',
        dark: '#1e7e34',
      },
      warning: {
        main: '#f9a825',
        light: '#ffc107',
        dark: '#c67d00',
      },
      error: {
        main: '#d73a49',
        light: '#cb2431',
        dark: '#9e1c23',
      },
      background: {
        default: mode === 'light' ? '#fafbfc' : '#0d1117',
        paper: mode === 'light' ? '#ffffff' : '#161b22',
      },
      text: {
        primary: mode === 'light' ? '#24292e' : '#c9d1d9',
        secondary: mode === 'light' ? '#586069' : '#8b949e',
      },
      divider: mode === 'light' ? '#e1e4e8' : '#30363d',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1: { fontSize: '0.875rem', fontWeight: 400 },
      body2: { fontSize: '0.8125rem', fontWeight: 400 },
    },
    shape: {
      borderRadius: 6,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 6,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: mode === 'light' ? '#e1e4e8' : '#30363d',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            backgroundColor: mode === 'light' ? '#f6f8fa' : '#161b22',
            color: mode === 'light' ? '#24292e' : '#c9d1d9',
          },
        },
      },
    },
  });

export const theme = createAppTheme('light');
