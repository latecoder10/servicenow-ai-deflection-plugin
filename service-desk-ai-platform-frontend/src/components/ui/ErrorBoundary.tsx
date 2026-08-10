import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { BugReportRounded } from '../../icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e1e4e8',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <BugReportRounded sx={{ fontSize: 64, color: '#d73a49', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#24292e', mb: 1 }}>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ color: '#586069', mb: 3 }}>
              An unexpected UI error occurred. Please try reloading the page.
            </Typography>
            {this.state.error && (
              <Box
                sx={{
                  p: 1.5,
                  mb: 3,
                  backgroundColor: '#fafbfc',
                  border: '1px solid #e1e4e8',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#d73a49',
                  textAlign: 'left',
                  maxHeight: 120,
                  overflow: 'auto',
                }}
              >
                {this.state.error.toString()}
              </Box>
            )}
            <Button variant="contained" color="primary" onClick={this.handleReset}>
              Reload Application
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
