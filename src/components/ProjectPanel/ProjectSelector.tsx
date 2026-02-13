import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import { useProjectStore } from '../../store/projectStore';
import { useDataStore } from '../../store/dataStore';
import { useEditorStore } from '../../store/editorStore';
import { parseDatabase, readFileAsText } from '../../utils/jsonIO';

export function ProjectSelector() {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const createProject = useProjectStore((state) => state.createProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);

  const setWorkGroups = useDataStore((state) => state.setWorkGroups);
  const setEditorMetadata = useEditorStore((state) => state.setMetadata);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName);
      setNewProjectName('');
      setCreateDialogOpen(false);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const text = await readFileAsText(file);
      const { data, error } = parseDatabase(text);

      if (error) {
        setImportError(error);
        return;
      }

      if (!data) {
        setImportError('Failed to parse database');
        return;
      }

      // Create new project with imported data
      const projectName = file.name.replace(/\.json$/, '');
      createProject(projectName);

      // Wait for project to be created
      setTimeout(() => {
        const newProjectId = useProjectStore.getState().activeProjectId;
        if (newProjectId) {
          setWorkGroups(data);
          // Initialize empty metadata for imported project
          setEditorMetadata({
            stations: [],
            lines: [],
            trainTypePatterns: [],
          });
        }
      }, 0);
    } catch (error) {
      setImportError(
        `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            fullWidth
          >
            New Project
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} component="label" fullWidth>
            Import JSON
            <input
              hidden
              accept=".json"
              type="file"
              onChange={handleImportJSON}
            />
          </Button>
        </Box>

        {importError && <Alert severity="error">{importError}</Alert>}

        {projects.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {projects.map((project) => (
                  <ListItem
                    key={project.id}
                    onClick={() => useProjectStore.getState().setActiveProject(project.id)}
                    sx={{
                      backgroundColor:
                        activeProjectId === project.id ? 'action.selected' : 'transparent',
                      cursor: 'pointer',
                      mb: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    secondaryAction={
                      <Tooltip title="Delete project">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemText
                      primary={project.name}
                      secondary={`Created: ${new Date(project.createdAt).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Stack>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateProject();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProjectName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
