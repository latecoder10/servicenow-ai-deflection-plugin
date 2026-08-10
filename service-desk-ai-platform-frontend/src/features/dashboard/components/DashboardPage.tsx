import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { useDashboard } from '../hooks/useDashboard';
import { OverviewMetrics } from './OverviewMetrics';
import { ConnectionStatusCard } from './ConnectionStatusCard';
import { DeflectionChart } from './DeflectionChart';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { ErrorAlert } from '../../../components/ui/ErrorAlert';
import {
  RefreshRounded,
  DashboardRounded,
  TrendingUpRounded,
  StorageRounded,
  TimelineRounded,
  AutoAwesomeRounded,
  CheckCircleRounded,
  CloudSyncRounded,
} from '../../../icons';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState<number>(0);

  const {
    dashboardData,
    deflectionMetrics,
    recentJobs,
    loading,
    error,
    actionLoading,
    refresh,
    handleTriggerSync,
    handleLoadSyntheticData,
  } = useDashboard();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '1.5rem' }}>
              Executive Operations Dashboard
            </Typography>
            <Chip
              label="Live Engine Active"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: isDark ? 'rgba(46, 160, 67, 0.2)' : '#e6f4ea',
                color: isDark ? '#56d364' : '#1e7e34',
                border: `1px solid ${isDark ? 'rgba(46, 160, 67, 0.4)' : '#c3e6cb'}`,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Real-time telemetry for ServiceNow Knowledge Sync & Pre-Ticket AI Deflection Engine
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard Telemetry">
          <IconButton
            onClick={refresh}
            disabled={loading}
            color="primary"
            sx={{
              border: `1px solid ${isDark ? '#30363d' : '#e1e4e8'}`,
              backgroundColor: isDark ? '#161b22' : '#ffffff',
              '&:hover': { backgroundColor: isDark ? '#21262d' : '#f6f8fa' },
            }}
          >
            <RefreshRounded />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      <ErrorAlert error={error} />

      {/* Navigation Tabs Bar */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          border: `1px solid ${isDark ? '#30363d' : '#e1e4e8'}`,
          borderRadius: '10px',
          px: 1.5,
          py: 0.5,
          mb: 1,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              backgroundColor: '#1f6beb',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 44,
              color: isDark ? '#8b949e' : '#57606a',
              px: 2,
              mr: 1,
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              '&:hover': {
                color: isDark ? '#f0f6fc' : '#24292f',
                backgroundColor: isDark ? 'rgba(177, 186, 196, 0.08)' : 'rgba(208, 215, 222, 0.2)',
              },
              '&.Mui-selected': {
                color: isDark ? '#58a6ff' : '#0366d6',
                fontWeight: 700,
              },
            },
          }}
        >
          <Tab
            icon={<DashboardRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Overview"
          />
          <Tab
            icon={<TrendingUpRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="AI Deflection Analytics"
          />
          <Tab
            icon={<StorageRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="System Telemetry & Connectors"
          />
          <Tab
            icon={<TimelineRounded sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Ingestion & Pipeline Jobs</span>
                {recentJobs.length > 0 && (
                  <Chip
                    label={recentJobs.length}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: isDark ? '#21262d' : '#f3f4f6',
                      color: isDark ? '#c9d1d9' : '#374151',
                      border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* TAB 0: OVERVIEW */}
      <CustomTabPanel value={activeTab} index={0}>
        <Box sx={{ mb: 3 }}>
          <OverviewMetrics metrics={deflectionMetrics} dashboard={dashboardData} loading={loading} />
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 3, alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <DeflectionChart />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <ConnectionStatusCard dashboard={dashboardData} loading={loading} />
          </Grid>
        </Grid>

        <Box sx={{ mb: 3 }}>
          <QuickActions
            onTriggerSync={handleTriggerSync}
            onLoadSynthetic={handleLoadSyntheticData}
            loading={actionLoading}
          />
        </Box>

        <Box>
          <RecentActivity jobs={recentJobs} loading={loading} />
        </Box>
      </CustomTabPanel>

      {/* TAB 1: AI DEFLECTION ANALYTICS */}
      <CustomTabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <OverviewMetrics metrics={deflectionMetrics} dashboard={dashboardData} loading={loading} />
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <DeflectionChart />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: '10px',
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                border: `1px solid ${isDark ? '#30363d' : '#e1e4e8'}`,
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AutoAwesomeRounded sx={{ color: '#0366d6', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                  AI Deflection Engine Efficiency
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 'auto' }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(56, 139, 253, 0.1)' : '#f0f7ff',
                    border: `1px solid ${isDark ? 'rgba(56, 139, 253, 0.3)' : '#c8e1ff'}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: isDark ? '#58a6ff' : '#0366d6', fontWeight: 700, textTransform: 'uppercase' }}>
                    Avg Confidence Score
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {deflectionMetrics?.averageConfidenceScore ? `${deflectionMetrics.averageConfidenceScore.toFixed(1)}%` : 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Composite score from vector relevance and source count
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(46, 160, 67, 0.1)' : '#f0fff4',
                    border: `1px solid ${isDark ? 'rgba(46, 160, 67, 0.3)' : '#dcffe4'}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: isDark ? '#56d364' : '#28a745', fontWeight: 700, textTransform: 'uppercase' }}>
                    Knowledge Base Size
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {deflectionMetrics?.knowledgeBaseDocumentsCount ?? dashboardData?.knowledgeIndexStats?.totalEmbeddingsInPinecone ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Documents indexed in vector store
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CustomTabPanel>

      {/* TAB 2: SYSTEM TELEMETRY & CONNECTORS */}
      <CustomTabPanel value={activeTab} index={2}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ConnectionStatusCard dashboard={dashboardData} loading={loading} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '10px',
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                border: `1px solid ${isDark ? '#30363d' : '#e1e4e8'}`,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudSyncRounded sx={{ color: isDark ? '#58a6ff' : '#0366d6' }} />
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                    Connector Infrastructure Overview
                  </Typography>
                </Box>
                <Chip
                  icon={<CheckCircleRounded style={{ fontSize: 14, color: isDark ? '#56d364' : '#28a745' }} />}
                  label="All Systems Nominal"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    backgroundColor: isDark ? 'rgba(46, 160, 67, 0.2)' : '#e6f4ea',
                    color: isDark ? '#56d364' : '#1e7e34',
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${isDark ? '#30363d' : '#f0f0f0'}` }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>ServiceNow REST API v2</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: dashboardData?.serviceNowConnection?.status === 'CONNECTED' ? '#56d364' : '#d73a49' }}>
                    {dashboardData?.serviceNowConnection?.status || 'UNKNOWN'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${isDark ? '#30363d' : '#f0f0f0'}` }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Pinecone Vector Index</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: (dashboardData?.knowledgeIndexStats?.totalEmbeddingsInPinecone ?? 0) > 0 ? '#56d364' : '#d73a49' }}>
                    {dashboardData?.knowledgeIndexStats?.totalEmbeddingsInPinecone ?? 0} vectors
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${isDark ? '#30363d' : '#f0f0f0'}` }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Gemini Embeddings</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#56d364' }}>
                    gemini-embedding-001
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Pinecone Index</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#58a6ff' }}>
                    {dashboardData?.knowledgeIndexStats?.activePineconeIndex || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CustomTabPanel>

      {/* TAB 3: INGESTION & PIPELINE JOBS */}
      <CustomTabPanel value={activeTab} index={3}>
        <Box sx={{ mb: 3 }}>
          <QuickActions
            onTriggerSync={handleTriggerSync}
            onLoadSynthetic={handleLoadSyntheticData}
            loading={actionLoading}
          />
        </Box>

        <Box>
          <RecentActivity jobs={recentJobs} loading={loading} />
        </Box>
      </CustomTabPanel>
    </Box>
  );
};


