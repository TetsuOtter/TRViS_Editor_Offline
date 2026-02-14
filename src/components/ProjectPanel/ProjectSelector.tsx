import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import { parseDatabase, readFileAsText, convertToEditorDatabase } from '../../utils/jsonIO';
import type { Database } from '../../types/trvis';
import type { DatabaseWithSettings } from '../../types/storage';
import type { Station, Line, LineStation, EditorMetadata } from '../../types/editor';

async function extractAndSaveMetadata(projectId: string, database: Database) {
  // 1. Collect all StationName + Location_m from TimetableRows
  const stationMap = new Map<
    string,
    { name: string; location_m: number; fullName?: string; longitude?: number; latitude?: number }
  >();

  for (const workGroup of database) {
    for (const work of workGroup.Works) {
      for (const train of work.Trains) {
        for (const row of train.TimetableRows) {
          if (!stationMap.has(row.StationName)) {
            stationMap.set(row.StationName, {
              name: row.StationName,
              location_m: row.Location_m,
              fullName: row.FullName,
              longitude: row.Longitude_deg,
              latitude: row.Latitude_deg,
            });
          }
        }
      }
    }
  }

  // 2. Sort by Location_m ascending
  const sortedStations = [...stationMap.values()].sort((a, b) => a.location_m - b.location_m);

  // 3. Generate Station objects
  const stations: Station[] = sortedStations.map((s) => ({
    id: uuidv4(),
    name: s.name,
    fullName: s.fullName,
    longitude: s.longitude,
    latitude: s.latitude,
  }));

  // 4. Generate LineStation & Line
  const lineStations: LineStation[] = stations.map((station, index) => ({
    stationId: station.id,
    distanceFromStart_m: sortedStations[index].location_m,
  }));

  const line: Line = {
    id: uuidv4(),
    name: database[0]?.Name ?? 'Imported Line',
    stations: lineStations,
  };

  // 5. Save metadata
  const metadata: EditorMetadata = {
    stations,
    lines: [line],
    trainTypePatterns: [],
  };

  await useProjectStore.getState().updateProjectMetadata(projectId, metadata);
}

export function ProjectSelector() {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const createProject = useProjectStore((state) => state.createProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const updateProjectData = useProjectStore((state) => state.updateProjectData);

  const setWorkGroups = useDataStore((state) => state.setWorkGroups);

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

      // Convert TRViS Database to editor format with display settings
      const editorDatabase: DatabaseWithSettings = convertToEditorDatabase(data as Database);

      // Create new project with imported data
      const projectName = file.name.replace(/\.json$/, '');
      const newProjectId = await createProject(projectName);

      // Update project with imported database and persist to localStorage
      await updateProjectData(newProjectId, editorDatabase);

      // Auto-generate Line and Stations from JSON
      await extractAndSaveMetadata(newProjectId, data as Database);

      // Update UI state
      setWorkGroups(editorDatabase);
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
            sx={{ textTransform: 'none' }}
          >
            New Project
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} component="label" fullWidth sx={{ textTransform: 'none' }}>
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
                sx={{ textTransform: 'none' }}
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
