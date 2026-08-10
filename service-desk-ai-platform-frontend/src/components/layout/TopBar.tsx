import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Tooltip as MuiTooltip,
  Button,
  ListItemIcon,
  ListItemText,
  Popover,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  NotificationsRounded,
  SearchRounded,
  SettingsRounded,
  KeyboardArrowDownRounded,
  DashboardRounded,
  MenuBookRounded,
  PsychologyRounded,
  FolderRounded,
  HubRounded,
  TimelineRounded,
  MenuRounded,
  CloseRounded,
  ChevronRightRounded,
} from '../../icons';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { AppLogo } from '../ui/AppLogo';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { globalSearchQuery, setGlobalSearchQuery } = useAppStore();
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();

  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [knowledgeAnchorEl, setKnowledgeAnchorEl] = useState<null | HTMLElement>(null);
  const [pipelineAnchorEl, setPipelineAnchorEl] = useState<null | HTMLElement>(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null);
  const [breadcrumbAnchorEl, setBreadcrumbAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentPath = location.pathname;

  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => setUserAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setUserAnchorEl(null);

  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => setNotifAnchorEl(e.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleKnowledgeOpen = (e: React.MouseEvent<HTMLElement>) => setKnowledgeAnchorEl(e.currentTarget);
  const handleKnowledgeClose = () => setKnowledgeAnchorEl(null);

  const handlePipelineOpen = (e: React.MouseEvent<HTMLElement>) => setPipelineAnchorEl(e.currentTarget);
  const handlePipelineClose = () => setPipelineAnchorEl(null);

  const handleBreadcrumbMenuOpen = (e: React.MouseEvent<HTMLElement>) => setBreadcrumbAnchorEl(e.currentTarget);
  const handleBreadcrumbMenuClose = () => setBreadcrumbAnchorEl(null);

  const handleSearchClick = (e: React.MouseEvent<HTMLElement>) => setSearchAnchorEl(e.currentTarget);
  const handleSearchClose = () => setSearchAnchorEl(null);

  const getBreadcrumbInfo = (path: string) => {
    switch (path) {
      case '/dashboard':
        return { category: 'Service Desk', page: 'Dashboard', icon: <DashboardRounded sx={{ fontSize: 16 }} /> };
      case '/knowledge':
        return { category: 'Knowledge & AI', page: 'Knowledge Articles', icon: <MenuBookRounded sx={{ fontSize: 16 }} /> };
      case '/suggestions':
        return { category: 'Knowledge & AI', page: 'AI Suggestions', icon: <PsychologyRounded sx={{ fontSize: 16 }} /> };
      case '/files':
        return { category: 'Knowledge & AI', page: 'Uploaded Documents', icon: <FolderRounded sx={{ fontSize: 16 }} /> };
      case '/connectors':
        return { category: 'Integrations & Pipeline', page: 'Connectors & ServiceNow', icon: <HubRounded sx={{ fontSize: 16 }} /> };
      case '/pipeline':
        return { category: 'Integrations & Pipeline', page: 'Sync Jobs & Pipeline', icon: <TimelineRounded sx={{ fontSize: 16 }} /> };
      case '/settings':
        return { category: 'System', page: 'Settings & Health', icon: <SettingsRounded sx={{ fontSize: 16 }} /> };
      default:
        return { category: 'Service Desk', page: 'Dashboard', icon: <DashboardRounded sx={{ fontSize: 16 }} /> };
    }
  };

  const breadcrumbInfo = getBreadcrumbInfo(currentPath);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchQuery.trim()) {
      navigate(`/knowledge?query=${encodeURIComponent(globalSearchQuery)}`);
      handleSearchClose();
    }
  };

  const isKnowledgeActive = ['/knowledge', '/suggestions', '/files'].includes(currentPath);
  const isPipelineActive = ['/connectors', '/pipeline'].includes(currentPath);
  const isDashboardActive = currentPath === '/dashboard';
  const isSettingsActive = currentPath === '/settings';

  const navBtnSx = (active: boolean) => ({
    color: active ? '#ffffff' : '#f0f6fc',
    backgroundColor: active ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
    fontWeight: active ? 700 : 500,
    fontSize: '0.875rem',
    textTransform: 'none',
    px: 1.5,
    py: 0.75,
    borderRadius: '6px',
    borderBottom: active ? '2px solid #58a6ff' : '2px solid transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      color: '#ffffff',
    },
  });

  return (
    <AppBar
      position="fixed"
      sx={{
        height: 64,
        backgroundColor: '#414951',
        color: '#ffffff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ height: 64, px: { xs: 1.5, sm: 2, md: 3 }, justifyContent: 'space-between', gap: 1 }}>
        {/* Left: Mobile Drawer Icon + Brand Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Hamburger Menu for Mobile (< sm) */}
          <IconButton
            onClick={() => setMobileDrawerOpen(true)}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              color: '#ffffff',
              p: 0.75,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <MenuRounded />
          </IconButton>

          <Box
            onClick={() => navigate('/dashboard')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              py: 0.5,
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <AppLogo height={36} mode="dark" variant="full" />
            </Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <AppLogo height={32} mode="dark" variant="icon" />
            </Box>
          </Box>
        </Box>

        {/* Center-Left: Full Navigation Dropdowns (Visible on Large Screens lg+) */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
          {/* Dashboard Direct Button */}
          <Button
            onClick={() => navigate('/dashboard')}
            startIcon={<DashboardRounded sx={{ fontSize: 18 }} />}
            sx={navBtnSx(isDashboardActive)}
          >
            Dashboard
          </Button>

          {/* Knowledge & AI Dropdown */}
          <Button
            onClick={handleKnowledgeOpen}
            startIcon={<MenuBookRounded sx={{ fontSize: 18 }} />}
            endIcon={<KeyboardArrowDownRounded sx={{ fontSize: 18 }} />}
            sx={navBtnSx(isKnowledgeActive)}
          >
            Knowledge & AI
          </Button>
          <Menu
            anchorEl={knowledgeAnchorEl}
            open={Boolean(knowledgeAnchorEl)}
            onClose={handleKnowledgeClose}
            slotProps={{
              paper: {
                elevation: 8,
                sx: {
                  minWidth: 240,
                  mt: 1,
                  p: 0.5,
                  borderRadius: '10px',
                  border: '1px solid #30363d',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                  backgroundColor: '#161b22 !important',
                  backgroundImage: 'none !important',
                  color: '#f0f6fc !important',
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleKnowledgeClose();
                navigate('/knowledge');
              }}
              selected={currentPath === '/knowledge'}
              sx={{
                py: 1.25,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                my: 0.25,
                color: '#f0f6fc !important',
                backgroundColor: currentPath === '/knowledge' ? 'rgba(3, 102, 214, 0.25) !important' : 'transparent',
                borderLeft: currentPath === '/knowledge' ? '3px solid #2196f3' : '3px solid transparent',
                transition: 'all 0.15s ease',
                '& .MuiListItemIcon-root': {
                  color: currentPath === '/knowledge' ? '#2196f3 !important' : '#8b949e !important',
                  minWidth: 36,
                },
                '& .MuiListItemText-primary': {
                  color: '#ffffff !important',
                  fontSize: '0.875rem',
                  fontWeight: currentPath === '/knowledge' ? 700 : 600,
                },
                '& .MuiListItemText-secondary': {
                  color: currentPath === '/knowledge' ? '#90caf9 !important' : '#8b949e !important',
                  fontSize: '0.75rem',
                },
                '&:hover': {
                  backgroundColor: currentPath === '/knowledge' ? 'rgba(3, 102, 214, 0.35) !important' : '#21262d !important',
                  '& .MuiListItemIcon-root': { color: '#2196f3 !important' },
                  '& .MuiListItemText-primary': { color: '#ffffff !important' },
                  '& .MuiListItemText-secondary': { color: '#c9d1d9 !important' },
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(3, 102, 214, 0.25) !important',
                  '&:hover': { backgroundColor: 'rgba(3, 102, 214, 0.35) !important' },
                },
              }}
            >
              <ListItemIcon>
                <MenuBookRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Knowledge Articles"
                secondary="Search & manage KB articles"
              />
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleKnowledgeClose();
                navigate('/suggestions');
              }}
              selected={currentPath === '/suggestions'}
              sx={{
                py: 1.25,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                my: 0.25,
                color: '#f0f6fc !important',
                backgroundColor: currentPath === '/suggestions' ? 'rgba(3, 102, 214, 0.25) !important' : 'transparent',
                borderLeft: currentPath === '/suggestions' ? '3px solid #2196f3' : '3px solid transparent',
                transition: 'all 0.15s ease',
                '& .MuiListItemIcon-root': {
                  color: currentPath === '/suggestions' ? '#2196f3 !important' : '#8b949e !important',
                  minWidth: 36,
                },
                '& .MuiListItemText-primary': {
                  color: '#ffffff !important',
                  fontSize: '0.875rem',
                  fontWeight: currentPath === '/suggestions' ? 700 : 600,
                },
                '& .MuiListItemText-secondary': {
                  color: currentPath === '/suggestions' ? '#90caf9 !important' : '#8b949e !important',
                  fontSize: '0.75rem',
                },
                '&:hover': {
                  backgroundColor: currentPath === '/suggestions' ? 'rgba(3, 102, 214, 0.35) !important' : '#21262d !important',
                  '& .MuiListItemIcon-root': { color: '#2196f3 !important' },
                  '& .MuiListItemText-primary': { color: '#ffffff !important' },
                  '& .MuiListItemText-secondary': { color: '#c9d1d9 !important' },
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(3, 102, 214, 0.25) !important',
                  '&:hover': { backgroundColor: 'rgba(3, 102, 214, 0.35) !important' },
                },
              }}
            >
              <ListItemIcon>
                <PsychologyRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="AI Suggestions"
                secondary="Deflection recommendations"
              />
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleKnowledgeClose();
                navigate('/files');
              }}
              selected={currentPath === '/files'}
              sx={{
                py: 1.25,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                my: 0.25,
                color: '#f0f6fc !important',
                backgroundColor: currentPath === '/files' ? 'rgba(3, 102, 214, 0.25) !important' : 'transparent',
                borderLeft: currentPath === '/files' ? '3px solid #2196f3' : '3px solid transparent',
                transition: 'all 0.15s ease',
                '& .MuiListItemIcon-root': {
                  color: currentPath === '/files' ? '#2196f3 !important' : '#8b949e !important',
                  minWidth: 36,
                },
                '& .MuiListItemText-primary': {
                  color: '#ffffff !important',
                  fontSize: '0.875rem',
                  fontWeight: currentPath === '/files' ? 700 : 600,
                },
                '& .MuiListItemText-secondary': {
                  color: currentPath === '/files' ? '#90caf9 !important' : '#8b949e !important',
                  fontSize: '0.75rem',
                },
                '&:hover': {
                  backgroundColor: currentPath === '/files' ? 'rgba(3, 102, 214, 0.35) !important' : '#21262d !important',
                  '& .MuiListItemIcon-root': { color: '#2196f3 !important' },
                  '& .MuiListItemText-primary': { color: '#ffffff !important' },
                  '& .MuiListItemText-secondary': { color: '#c9d1d9 !important' },
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(3, 102, 214, 0.25) !important',
                  '&:hover': { backgroundColor: 'rgba(3, 102, 214, 0.35) !important' },
                },
              }}
            >
              <ListItemIcon>
                <FolderRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Uploaded Documents"
                secondary="Files & Pinecone vector status"
              />
            </MenuItem>
          </Menu>

          {/* Data Pipeline Dropdown */}
          <Button
            onClick={handlePipelineOpen}
            startIcon={<TimelineRounded sx={{ fontSize: 18 }} />}
            endIcon={<KeyboardArrowDownRounded sx={{ fontSize: 18 }} />}
            sx={navBtnSx(isPipelineActive)}
          >
            Integrations & Pipeline
          </Button>
          <Menu
            anchorEl={pipelineAnchorEl}
            open={Boolean(pipelineAnchorEl)}
            onClose={handlePipelineClose}
            slotProps={{
              paper: {
                elevation: 8,
                sx: {
                  minWidth: 250,
                  mt: 1,
                  p: 0.5,
                  borderRadius: '10px',
                  border: '1px solid #30363d',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                  backgroundColor: '#161b22 !important',
                  backgroundImage: 'none !important',
                  color: '#f0f6fc !important',
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handlePipelineClose();
                navigate('/connectors');
              }}
              selected={currentPath === '/connectors'}
              sx={{
                py: 1.25,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                my: 0.25,
                color: '#f0f6fc !important',
                backgroundColor: currentPath === '/connectors' ? 'rgba(3, 102, 214, 0.25) !important' : 'transparent',
                borderLeft: currentPath === '/connectors' ? '3px solid #2196f3' : '3px solid transparent',
                transition: 'all 0.15s ease',
                '& .MuiListItemIcon-root': {
                  color: currentPath === '/connectors' ? '#2196f3 !important' : '#8b949e !important',
                  minWidth: 36,
                },
                '& .MuiListItemText-primary': {
                  color: '#ffffff !important',
                  fontSize: '0.875rem',
                  fontWeight: currentPath === '/connectors' ? 700 : 600,
                },
                '& .MuiListItemText-secondary': {
                  color: currentPath === '/connectors' ? '#90caf9 !important' : '#8b949e !important',
                  fontSize: '0.75rem',
                },
                '&:hover': {
                  backgroundColor: currentPath === '/connectors' ? 'rgba(3, 102, 214, 0.35) !important' : '#21262d !important',
                  '& .MuiListItemIcon-root': { color: '#2196f3 !important' },
                  '& .MuiListItemText-primary': { color: '#ffffff !important' },
                  '& .MuiListItemText-secondary': { color: '#c9d1d9 !important' },
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(3, 102, 214, 0.25) !important',
                  '&:hover': { backgroundColor: 'rgba(3, 102, 214, 0.35) !important' },
                },
              }}
            >
              <ListItemIcon>
                <HubRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Connectors & ServiceNow"
                secondary="API test & ServiceNow sync"
              />
            </MenuItem>
            <MenuItem
              onClick={() => {
                handlePipelineClose();
                navigate('/pipeline');
              }}
              selected={currentPath === '/pipeline'}
              sx={{
                py: 1.25,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                my: 0.25,
                color: '#f0f6fc !important',
                backgroundColor: currentPath === '/pipeline' ? 'rgba(3, 102, 214, 0.25) !important' : 'transparent',
                borderLeft: currentPath === '/pipeline' ? '3px solid #2196f3' : '3px solid transparent',
                transition: 'all 0.15s ease',
                '& .MuiListItemIcon-root': {
                  color: currentPath === '/pipeline' ? '#2196f3 !important' : '#8b949e !important',
                  minWidth: 36,
                },
                '& .MuiListItemText-primary': {
                  color: '#ffffff !important',
                  fontSize: '0.875rem',
                  fontWeight: currentPath === '/pipeline' ? 700 : 600,
                },
                '& .MuiListItemText-secondary': {
                  color: currentPath === '/pipeline' ? '#90caf9 !important' : '#8b949e !important',
                  fontSize: '0.75rem',
                },
                '&:hover': {
                  backgroundColor: currentPath === '/pipeline' ? 'rgba(3, 102, 214, 0.35) !important' : '#21262d !important',
                  '& .MuiListItemIcon-root': { color: '#2196f3 !important' },
                  '& .MuiListItemText-primary': { color: '#ffffff !important' },
                  '& .MuiListItemText-secondary': { color: '#c9d1d9 !important' },
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(3, 102, 214, 0.25) !important',
                  '&:hover': { backgroundColor: 'rgba(3, 102, 214, 0.35) !important' },
                },
              }}
            >
              <ListItemIcon>
                <TimelineRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Sync Jobs & Pipeline"
                secondary="Execution status & metrics"
              />
            </MenuItem>
          </Menu>
        </Box>

        {/* Center-Left: Breadcrumb Navigation (Visible on Reduced/Medium Screens sm to lg) */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex', lg: 'none' },
            alignItems: 'center',
            gap: 0.75,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            px: 1.25,
            py: 0.5,
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Dashboard Home Link / Switcher when on Dashboard */}
          {currentPath === '/dashboard' ? (
            <Button
              size="small"
              onClick={handleBreadcrumbMenuOpen}
              startIcon={<DashboardRounded sx={{ fontSize: 16, color: '#58a6ff' }} />}
              endIcon={<KeyboardArrowDownRounded sx={{ fontSize: 16 }} />}
              sx={{
                color: '#ffffff',
                backgroundColor: 'rgba(56, 139, 253, 0.15)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                textTransform: 'none',
                p: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 139, 253, 0.3)',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'rgba(56, 139, 253, 0.25)',
                },
              }}
            >
              Dashboard
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => navigate('/dashboard')}
              startIcon={<DashboardRounded sx={{ fontSize: 16, color: '#8b949e' }} />}
              sx={{
                color: '#f0f6fc',
                fontSize: '0.8125rem',
                fontWeight: 500,
                textTransform: 'none',
                p: '2px 6px',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff' },
              }}
            >
              Dashboard
            </Button>
          )}

          {currentPath !== '/dashboard' && (
            <>
              <ChevronRightRounded sx={{ fontSize: 16, color: '#8b949e', flexShrink: 0 }} />

              <Typography
                variant="body2"
                sx={{
                  color: '#8b949e',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', md: 'inline' },
                }}
              >
                {breadcrumbInfo.category}
              </Typography>

              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <ChevronRightRounded sx={{ fontSize: 16, color: '#8b949e', flexShrink: 0 }} />
              </Box>

              {/* Active Page Switcher Button */}
              <Button
                size="small"
                onClick={handleBreadcrumbMenuOpen}
                endIcon={<KeyboardArrowDownRounded sx={{ fontSize: 16 }} />}
                startIcon={breadcrumbInfo.icon}
                sx={{
                  color: '#58a6ff',
                  backgroundColor: 'rgba(56, 139, 253, 0.15)',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  p: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 139, 253, 0.3)',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: 'rgba(56, 139, 253, 0.25)',
                  },
                }}
              >
                {breadcrumbInfo.page}
              </Button>
            </>
          )}
        </Box>

        {/* Quick-Switch Breadcrumb Dropdown Menu */}
        <Menu
          anchorEl={breadcrumbAnchorEl}
          open={Boolean(breadcrumbAnchorEl)}
          onClose={handleBreadcrumbMenuClose}
          slotProps={{
            paper: {
              elevation: 8,
              sx: {
                minWidth: 240,
                mt: 1,
                p: 0.5,
                borderRadius: '10px',
                border: '1px solid #30363d',
                boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                backgroundColor: '#161b22 !important',
                backgroundImage: 'none !important',
                color: '#f0f6fc !important',
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleBreadcrumbMenuClose();
              navigate('/dashboard');
            }}
            selected={currentPath === '/dashboard'}
            sx={{ py: 1, px: 2, borderRadius: '6px', my: 0.25, color: '#f0f6fc !important' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: '#58a6ff !important' }}>
              <DashboardRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" secondary="Main Overview & Analytics" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '0.75rem', color: '#8b949e' }} />
          </MenuItem>

          <Divider sx={{ my: 0.5, borderColor: '#30363d' }} />

          <MenuItem
            onClick={() => {
              handleBreadcrumbMenuClose();
              navigate('/knowledge');
            }}
            selected={currentPath === '/knowledge'}
            sx={{ py: 1, px: 2, borderRadius: '6px', my: 0.25, color: '#f0f6fc !important' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: currentPath === '/knowledge' ? '#2196f3 !important' : '#8b949e !important' }}>
              <MenuBookRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Knowledge Articles" secondary="Search & manage KB articles" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '0.75rem', color: '#8b949e' }} />
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleBreadcrumbMenuClose();
              navigate('/suggestions');
            }}
            selected={currentPath === '/suggestions'}
            sx={{ py: 1, px: 2, borderRadius: '6px', my: 0.25, color: '#f0f6fc !important' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: currentPath === '/suggestions' ? '#2196f3 !important' : '#8b949e !important' }}>
              <PsychologyRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="AI Suggestions" secondary="Deflection recommendations" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '0.75rem', color: '#8b949e' }} />
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleBreadcrumbMenuClose();
              navigate('/files');
            }}
            selected={currentPath === '/files'}
            sx={{ py: 1, px: 2, borderRadius: '6px', my: 0.25, color: '#f0f6fc !important' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: currentPath === '/files' ? '#2196f3 !important' : '#8b949e !important' }}>
              <FolderRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Uploaded Documents" secondary="Files & Pinecone vector status" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '0.75rem', color: '#8b949e' }} />
          </MenuItem>

          <Divider sx={{ my: 0.5, borderColor: '#30363d' }} />

          <MenuItem
            onClick={() => {
              handleBreadcrumbMenuClose();
              navigate('/connectors');
            }}
            selected={currentPath === '/connectors'}
            sx={{ py: 1, px: 2, borderRadius: '6px', my: 0.25, color: '#f0f6fc !important' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: currentPath === '/connectors' ? '#2196f3 !important' : '#8b949e !important' }}>
              <HubRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Connectors & ServiceNow" secondary="API test & ServiceNow sync" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '0.75rem', color: '#8b949e' }} />
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleBreadcrumbMenuClose();
              navigate('/pipeline');
            }}
            selected={currentPath === '/pipeline'}
            sx={{ py: 1, px: 2, borderRadius: '6px', my: 0.25, color: '#f0f6fc !important' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: currentPath === '/pipeline' ? '#2196f3 !important' : '#8b949e !important' }}>
              <TimelineRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sync Jobs & Pipeline" secondary="Execution status & metrics" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '0.75rem', color: '#8b949e' }} />
          </MenuItem>
        </Menu>

        {/* Center-Right: Search Input or Search Icon Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', mr: 0.5 }}>
          {/* Full Search Bar for Normal Screens (sm+) */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '6px',
              px: 1.5,
              py: 0.5,
              width: { sm: 160, md: 220, lg: 260, xl: 300 },
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s',
              '&:focus-within': {
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                width: { sm: 200, md: 260, lg: 300, xl: 340 },
              },
            }}
          >
            <SearchRounded sx={{ color: '#c9d1d9', fontSize: 18, mr: 1 }} />
            <InputBase
              placeholder="Search KB, incidents..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              sx={{
                color: '#ffffff',
                width: '100%',
                fontSize: '0.85rem',
                '& input::placeholder': {
                  color: '#8b949e',
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Search Icon Button for Squeezed Screens (xs) */}
          <MuiTooltip title="Search">
            <IconButton
              onClick={handleSearchClick}
              sx={{
                display: { xs: 'flex', sm: 'none' },
                width: 36,
                height: 36,
                color: Boolean(searchAnchorEl) ? '#ffffff' : '#f0f6fc',
                backgroundColor: Boolean(searchAnchorEl) ? 'rgba(0,0,0,0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                },
              }}
            >
              <SearchRounded sx={{ fontSize: 20 }} />
            </IconButton>
          </MuiTooltip>

          {/* Popover for Search Input */}
          <Popover
            open={Boolean(searchAnchorEl)}
            anchorEl={searchAnchorEl}
            onClose={handleSearchClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  p: 1.5,
                  width: 300,
                  backgroundColor: '#2b3138',
                  border: '1px solid #484f58',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                },
              },
            }}
          >
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
              <InputBase
                autoFocus
                placeholder="Search KB, incidents..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                sx={{
                  color: '#ffffff',
                  width: '100%',
                  fontSize: '0.875rem',
                  backgroundColor: '#161b22',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: '6px',
                  border: '1px solid #30363d',
                  '& input::placeholder': {
                    color: '#8b949e',
                    opacity: 1,
                  },
                }}
              />
              <IconButton type="submit" sx={{ color: '#2196f3', ml: 1 }}>
                <SearchRounded fontSize="small" />
              </IconButton>
            </Box>
          </Popover>
        </Box>

        {/* Right Section: Settings + Notifications + User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <MuiTooltip title="Settings & Health">
            <IconButton
              onClick={() => navigate('/settings')}
              sx={{
                width: 36,
                height: 36,
                color: isSettingsActive ? '#58a6ff' : '#f0f6fc',
                backgroundColor: isSettingsActive ? 'rgba(0,0,0,0.3)' : 'rgba(255, 255, 255, 0.1)',
                border: isSettingsActive ? '1px solid #58a6ff' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                },
              }}
            >
              <SettingsRounded sx={{ fontSize: 20 }} />
            </IconButton>
          </MuiTooltip>

          <MuiTooltip title="Notifications">
            <IconButton
              onClick={handleNotifOpen}
              sx={{
                width: 36,
                height: 36,
                color: '#f0f6fc',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6875rem',
                    height: 16,
                    minWidth: 16,
                    padding: '0 4px',
                    backgroundColor: '#1f6beb',
                    fontWeight: 700,
                    top: -2,
                    right: -2,
                  },
                }}
              >
                <NotificationsRounded sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </MuiTooltip>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            slotProps={{
              paper: {
                elevation: 8,
                sx: {
                  width: 340,
                  maxHeight: 420,
                  mt: 1,
                  p: 0,
                  borderRadius: '10px',
                  border: '1px solid #30363d',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                  backgroundColor: '#161b22 !important',
                  backgroundImage: 'none !important',
                  color: '#f0f6fc !important',
                  overflow: 'hidden',
                },
              },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                Notifications
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                {unreadCount} unread
              </Typography>
            </Box>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#8b949e', fontSize: '0.875rem' }}>
                No new notifications
              </Box>
            ) : (
              notifications.map((notif) => (
                <MenuItem
                  key={notif.id}
                  onClick={handleNotifClose}
                  sx={{ py: 1.25, px: 2, whiteSpace: 'normal', borderBottom: '1px solid #21262d', '&:hover': { backgroundColor: '#21262d' } }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: notif.read ? 400 : 600, color: '#f0f6fc' }}>
                      {notif.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.25 }}>
                      {notif.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

          {/* User Profile Button */}
          <MuiTooltip title={user?.name || 'User Account'}>
            <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: '#0366d6',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                {user?.name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </MuiTooltip>

          <Menu
            anchorEl={userAnchorEl}
            open={Boolean(userAnchorEl)}
            onClose={handleUserMenuClose}
            slotProps={{
              paper: {
                elevation: 8,
                sx: {
                  minWidth: 220,
                  mt: 1,
                  p: 0.5,
                  borderRadius: '10px',
                  border: '1px solid #30363d',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
                  backgroundColor: '#161b22 !important',
                  backgroundImage: 'none !important',
                  color: '#f0f6fc !important',
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #30363d' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                {user?.name || 'Admin User'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                {user?.email || 'admin@example.com'}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate('/settings');
              }}
              sx={{
                py: 1,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                my: 0.25,
                color: '#f0f6fc !important',
                '&:hover': { backgroundColor: '#21262d !important', color: '#ffffff !important' },
                '& .MuiListItemIcon-root': { color: '#8b949e !important', minWidth: 32 },
                '& .MuiListItemText-primary': { color: '#f0f6fc !important', fontSize: '0.875rem' },
              }}
            >
              <ListItemIcon>
                <SettingsRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings & Health" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                logout();
              }}
              sx={{
                py: 1,
                px: 2,
                borderRadius: '6px',
                mx: 0.5,
                my: 0.25,
                color: '#f85149 !important',
                '&:hover': { backgroundColor: 'rgba(248, 81, 73, 0.15) !important' },
                '& .MuiListItemText-primary': { color: '#f85149 !important', fontSize: '0.875rem', fontWeight: 600 },
              }}
            >
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Mobile Navigation Drawer (< sm) */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.6)' } },
        }}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: '#161b22',
            color: '#f0f6fc',
            borderRight: '1px solid #30363d',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #30363d' }}>
          <AppLogo height={32} mode="dark" variant="full" />
          <IconButton onClick={() => setMobileDrawerOpen(false)} sx={{ color: '#8b949e' }}>
            <CloseRounded />
          </IconButton>
        </Box>
        <List sx={{ p: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/dashboard');
              }}
              selected={isDashboardActive}
              sx={{ borderRadius: '6px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: isDashboardActive ? '#2196f3' : '#8b949e', minWidth: 36 }}>
                <DashboardRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isDashboardActive ? 700 : 500 }} />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1, borderColor: '#30363d' }} />

          <Typography variant="caption" sx={{ px: 2, py: 0.5, color: '#8b949e', display: 'block', fontWeight: 600 }}>
            KNOWLEDGE & AI
          </Typography>

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/knowledge');
              }}
              selected={currentPath === '/knowledge'}
              sx={{ borderRadius: '6px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: currentPath === '/knowledge' ? '#2196f3' : '#8b949e', minWidth: 36 }}>
                <MenuBookRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Knowledge Articles" primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/suggestions');
              }}
              selected={currentPath === '/suggestions'}
              sx={{ borderRadius: '6px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: currentPath === '/suggestions' ? '#2196f3' : '#8b949e', minWidth: 36 }}>
                <PsychologyRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="AI Suggestions" primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/files');
              }}
              selected={currentPath === '/files'}
              sx={{ borderRadius: '6px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: currentPath === '/files' ? '#2196f3' : '#8b949e', minWidth: 36 }}>
                <FolderRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Uploaded Documents" primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1, borderColor: '#30363d' }} />

          <Typography variant="caption" sx={{ px: 2, py: 0.5, color: '#8b949e', display: 'block', fontWeight: 600 }}>
            INTEGRATIONS & PIPELINE
          </Typography>

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/connectors');
              }}
              selected={currentPath === '/connectors'}
              sx={{ borderRadius: '6px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: currentPath === '/connectors' ? '#2196f3' : '#8b949e', minWidth: 36 }}>
                <HubRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Connectors & ServiceNow" primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/pipeline');
              }}
              selected={currentPath === '/pipeline'}
              sx={{ borderRadius: '6px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: currentPath === '/pipeline' ? '#2196f3' : '#8b949e', minWidth: 36 }}>
                <TimelineRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sync Jobs & Pipeline" primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1, borderColor: '#30363d' }} />

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/settings');
              }}
              selected={isSettingsActive}
              sx={{ borderRadius: '6px' }}
            >
              <ListItemIcon sx={{ color: isSettingsActive ? '#2196f3' : '#8b949e', minWidth: 36 }}>
                <SettingsRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings & Health" primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
};
