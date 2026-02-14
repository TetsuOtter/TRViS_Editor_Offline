import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Drawer, List, ListItem, ListItemText, Typography, Divider, IconButton, Tooltip, CircularProgress } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { useAutoSave } from './hooks/useAutoSave';
import { useTheme } from './contexts/ThemeContext';
import EditorPage from './pages/EditorPage';
import SettingsPage from './pages/SettingsPage';
import ThirdPartyLicensesPage from './pages/ThirdPartyLicensesPage';

const drawerWidth = 280;

function AppContent() {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const isInitialized = useProjectStore((state) => state.isInitialized);
  const initialize = useProjectStore((state) => state.initialize);
  const { mode, setMode, effectiveMode } = useTheme();

  // Initialize store on mount
  useEffect(() => {
    initialize().catch(error => console.error('Failed to initialize projects:', error));
  }, [initialize]);

  useAutoSave(true);

  const handleThemeToggle = () => {
    if (mode === 'system') {
      // If on system mode, switch to the opposite of current effective mode
      setMode(effectiveMode === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setMode(mode === 'dark' ? 'light' : 'dark');
    }
  };

  // Show loading state
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            TRViS Editor {activeProject ? `- ${activeProject.name}` : ''}
          </Typography>
          <Tooltip title={`Switch to ${effectiveMode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={handleThemeToggle}>
              {effectiveMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={() => navigate('/settings')}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            marginTop: '64px',
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ p: 2, fontWeight: 'bold' }}>
          Projects
        </Typography>
        <List>
          {projects.length === 0 ? (
            <ListItem>
              <ListItemText primary="No projects" />
            </ListItem>
          ) : (
            projects.map((project) => (
              <ListItem
                key={project.id}
                onClick={() => setActiveProject(project.id).catch(error => console.error('Failed to set active project:', error))}
                sx={{
                  backgroundColor:
                    activeProjectId === project.id ? 'action.selected' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText primary={project.name} />
              </ListItem>
            ))
          )}
        </List>

        <Divider sx={{ my: 1 }} />

        <List>
          <ListItem
            onClick={() => navigate('/settings')}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <SettingsIcon sx={{ mr: 1 }} />
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
        }}
      >
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/licenses" element={<ThirdPartyLicensesPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
