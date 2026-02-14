import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MapIcon from '@mui/icons-material/Map';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { Breadcrumbs } from '../components/Navigation/Breadcrumbs';
import type { BreadcrumbItemWithSiblings } from '../components/Navigation/Breadcrumbs';
import { StationDialog } from '../components/Dialogs/StationDialog';
import { LineDialog } from '../components/Dialogs/LineDialog';
import type { WorkGroup } from '../types/trvis';
import { v4 as uuidv4 } from 'uuid';

export function WorkGroupListPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const workGroups = useDataStore((state) => state.workGroups);
  const addWorkGroup = useDataStore((state) => state.addWorkGroup);
  const updateWorkGroup = useDataStore((state) => state.updateWorkGroup);
  const deleteWorkGroup = useDataStore((state) => state.deleteWorkGroup);
  const syncWithProject = useDataStore((state) => state.syncWithProject);
  const projects = useProjectStore((state) => state.projects);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const syncEditorWithProject = useEditorStore((state) => state.syncWithProject);
  const activeProject = projects.find((p) => p.id === projectId);

  // Sync data when page loads
  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId).catch(error => console.error('Failed to set active project:', error));
      syncWithProject(projectId);
      syncEditorWithProject(projectId);
    }
  }, [projectId, setActiveProject, syncWithProject, syncEditorWithProject]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [workGroupName, setWorkGroupName] = useState('');
  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);

  const handleCreate = () => {
    if (workGroupName.trim()) {
      const newWG: WorkGroup = {
        Id: uuidv4(),
        Name: workGroupName,
        Works: [],
      };
      addWorkGroup(newWG);
      setWorkGroupName('');
      setCreateDialogOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingIndex !== null && workGroupName.trim()) {
      const wg = workGroups[editingIndex];
      updateWorkGroup(editingIndex, { ...wg, Name: workGroupName });
      setWorkGroupName('');
      setEditingIndex(null);
      setEditDialogOpen(false);
    }
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setWorkGroupName(workGroups[index].Name);
    setEditDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this WorkGroup?')) {
      deleteWorkGroup(index);
    }
  };

  const handleNavigateToWorks = (workGroupIndex: number) => {
    const wg = workGroups[workGroupIndex];
    navigate(`/project/${projectId}/workgroup/${wg.Id || workGroupIndex}/works`);
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItemWithSiblings[] = [
    {
      label: 'Projects',
      path: '/',
      siblings: projects.map((p) => ({
        label: p.name,
        path: `/project/${p.id}/workgroups`,
      })),
    },
    {
      label: activeProject?.name || 'Unknown Project',
    },
  ];

  return (
    <Box>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Quick Access Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ApartmentIcon />}
          onClick={() => setStationDialogOpen(true)}
        >
          Stations
        </Button>
        <Button variant="outlined" startIcon={<MapIcon />} onClick={() => setLineDialogOpen(true)}>
          Lines
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">WorkGroups</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create WorkGroup
        </Button>
      </Box>

      {workGroups.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No WorkGroups
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Create a WorkGroup to start organizing your work.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create First WorkGroup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {workGroups.map((wg, index) => (
            <Grid key={wg.Id || index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {wg.Name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {wg.Works.length} Work{wg.Works.length !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenEdit(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => handleNavigateToWorks(index)}
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth>
        <DialogTitle>Create New WorkGroup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="WorkGroup Name"
            value={workGroupName}
            onChange={(e) => setWorkGroupName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!workGroupName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle>Edit WorkGroup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="WorkGroup Name"
            value={workGroupName}
            onChange={(e) => setWorkGroupName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleEdit();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={!workGroupName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Station and Line Dialogs */}
      <StationDialog open={stationDialogOpen} onClose={() => setStationDialogOpen(false)} />
      <LineDialog open={lineDialogOpen} onClose={() => setLineDialogOpen(false)} />
    </Box>
  );
}
