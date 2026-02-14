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
  Stack,
  Typography,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrainIcon from '@mui/icons-material/Train';
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
import type { Work } from '../types/trvis';
import { v4 as uuidv4 } from 'uuid';

export function WorkListPage() {
  const navigate = useNavigate();
  const { projectId, workGroupId } = useParams<{ projectId: string; workGroupId: string }>();
  const workGroups = useDataStore((state) => state.workGroups);
  const addWork = useDataStore((state) => state.addWork);
  const updateWork = useDataStore((state) => state.updateWork);
  const deleteWork = useDataStore((state) => state.deleteWork);
  const syncWithProject = useDataStore((state) => state.syncWithProject);
  const projects = useProjectStore((state) => state.projects);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const syncEditorWithProject = useEditorStore((state) => state.syncWithProject);

  // Sync data when page loads
  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId).catch(error => console.error('Failed to set active project:', error));
      syncWithProject(projectId);
      syncEditorWithProject(projectId);
    }
  }, [projectId, setActiveProject, syncWithProject, syncEditorWithProject]);

  // Find workGroup by Id or by index
  const workGroupIndex = workGroups.findIndex(
    (wg) => wg.Id === workGroupId || workGroups.indexOf(wg).toString() === workGroupId
  );
  const workGroup = workGroups[workGroupIndex];

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [workName, setWorkName] = useState('');
  const [affectDate, setAffectDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);

  if (!workGroup) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          WorkGroup not found
        </Typography>
        <Button onClick={() => navigate(`/project/${projectId}/workgroups`)}>
          Back to WorkGroups
        </Button>
      </Box>
    );
  }

  const handleCreate = () => {
    if (workName.trim() && affectDate.trim()) {
      const newWork: Work = {
        Id: uuidv4(),
        Name: workName,
        AffectDate: affectDate,
        Remarks: remarks,
        Trains: [],
      };
      addWork(workGroupIndex, newWork);
      setWorkName('');
      setAffectDate('');
      setRemarks('');
      setCreateDialogOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingIndex !== null && workName.trim() && affectDate.trim()) {
      const work = workGroup.Works[editingIndex];
      updateWork(workGroupIndex, editingIndex, {
        ...work,
        Name: workName,
        AffectDate: affectDate,
        Remarks: remarks,
      });
      setWorkName('');
      setAffectDate('');
      setRemarks('');
      setEditingIndex(null);
      setEditDialogOpen(false);
    }
  };

  const handleOpenEdit = (index: number) => {
    const work = workGroup.Works[index];
    setEditingIndex(index);
    setWorkName(work.Name);
    setAffectDate(work.AffectDate);
    setRemarks(work.Remarks || '');
    setEditDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this Work?')) {
      deleteWork(workGroupIndex, index);
    }
  };

  const handleNavigateToTrains = (workIndex: number) => {
    const work = workGroup.Works[workIndex];
    navigate(
      `/project/${projectId}/workgroup/${workGroupId}/work/${work.Id || workIndex}/trains`
    );
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
      label: 'WorkGroups',
      path: `/project/${projectId}/workgroups`,
      siblings: workGroups.map((wg, idx) => ({
        label: wg.Name,
        path: `/project/${projectId}/workgroup/${wg.Id || idx}/works`,
      })),
    },
    {
      label: workGroup.Name,
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
        <Typography variant="h4">Works</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Work
        </Button>
      </Box>

      {workGroup.Works.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Works
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Create a Work to start adding trains.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create First Work
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {workGroup.Works.map((work, index) => (
            <Grid key={work.Id || index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {work.Name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Date: {work.AffectDate}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TrainIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {work.Trains.length} Train{work.Trains.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  {work.Remarks && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        mt: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {work.Remarks}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenEdit(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => handleNavigateToTrains(index)}
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
        <DialogTitle>Create New Work</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Work Name"
              value={workName}
              onChange={(e) => setWorkName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Affect Date (YYYYMMDD)"
              value={affectDate}
              onChange={(e) => setAffectDate(e.target.value)}
              placeholder="20240101"
            />
            <TextField
              fullWidth
              label="Remarks (HTML supported)"
              multiline
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!workName.trim() || !affectDate.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle>Edit Work</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Work Name"
              value={workName}
              onChange={(e) => setWorkName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Affect Date (YYYYMMDD)"
              value={affectDate}
              onChange={(e) => setAffectDate(e.target.value)}
              placeholder="20240101"
            />
            <TextField
              fullWidth
              label="Remarks (HTML supported)"
              multiline
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={!workName.trim() || !affectDate.trim()}
          >
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
