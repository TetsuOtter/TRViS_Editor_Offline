import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, AppBar, Toolbar, Drawer, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useProjectStore } from './store/projectStore';
import { useAutoSave } from './hooks/useAutoSave';
import EditorPage from './pages/EditorPage';
import SettingsPage from './pages/SettingsPage';

const drawerWidth = 280;

function AppContent() {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);

  useAutoSave(true);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            TRViS Editor {activeProject ? `- ${activeProject.name}` : ''}
          </Typography>
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
                onClick={() => setActiveProject(project.id)}
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
