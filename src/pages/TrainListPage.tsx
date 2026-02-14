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
  Chip,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DirectionsIcon from '@mui/icons-material/Directions';
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
import { generateTimetableFromPattern } from '../utils/trainGenerator';
import type { Train } from '../types/trvis';
import { v4 as uuidv4 } from 'uuid';

export function TrainListPage() {
  const navigate = useNavigate();
  const { projectId, workGroupId, workId } = useParams<{
    projectId: string;
    workGroupId: string;
    workId: string;
  }>();
  const workGroups = useDataStore((state) => state.workGroups);
  const addTrain = useDataStore((state) => state.addTrain);
  const updateTrain = useDataStore((state) => state.updateTrain);
  const deleteTrain = useDataStore((state) => state.deleteTrain);
  const cloneTrain = useDataStore((state) => state.cloneTrain);
  const syncWithProject = useDataStore((state) => state.syncWithProject);
  const projects = useProjectStore((state) => state.projects);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const syncEditorWithProject = useEditorStore((state) => state.syncWithProject);

  const trainTypePatterns = useEditorStore((state) => state.trainTypePatterns);
  const stations = useEditorStore((state) => state.stations);
  const getLine = useEditorStore((state) => state.getLine);
  const getTrainTypePattern = useEditorStore((state) => state.getTrainTypePattern);

  // Sync data when page loads
  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId).catch(error => console.error('Failed to set active project:', error));
      syncWithProject(projectId);
      syncEditorWithProject(projectId);
    }
  }, [projectId, setActiveProject, syncWithProject, syncEditorWithProject]);

  // Find workGroup and work
  const workGroupIndex = workGroups.findIndex(
    (wg) => wg.Id === workGroupId || workGroups.indexOf(wg).toString() === workGroupId
  );
  const workGroup = workGroups[workGroupIndex];
  const workIndex = workGroup?.Works.findIndex(
    (w) => w.Id === workId || workGroup.Works.indexOf(w).toString() === workId
  );
  const work = workGroup?.Works[workIndex ?? -1];

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [cloneTrainIndex, setCloneTrainIndex] = useState<number | null>(null);
  const [trainNumber, setTrainNumber] = useState('');
  const [direction, setDirection] = useState<number>(1);
  const [maxSpeed, setMaxSpeed] = useState<string>('');
  const [carCount, setCarCount] = useState<number | ''>('');
  const [cloneTrainNumber, setCloneTrainNumber] = useState('');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('');
  const [departureTime, setDepartureTime] = useState('08:00:00');
  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);

  if (!workGroup || !work || workIndex === undefined || workIndex === -1) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Work not found
        </Typography>
        <Button onClick={() => navigate(`/project/${projectId}/workgroup/${workGroupId}/works`)}>
          Back to Works
        </Button>
      </Box>
    );
  }

  const handleCreate = () => {
    if (trainNumber.trim()) {
      const newTrain: Train = {
        Id: uuidv4(),
        TrainNumber: trainNumber,
        Direction: direction,
        MaxSpeed: maxSpeed || undefined,
        CarCount: carCount || undefined,
        TimetableRows: [],
      };
      addTrain(workGroupIndex, workIndex, newTrain);
      setTrainNumber('');
      setDirection(1);
      setMaxSpeed('');
      setCarCount('');
      setCreateDialogOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingIndex !== null && trainNumber.trim()) {
      const train = work.Trains[editingIndex];
      updateTrain(workGroupIndex, workIndex, editingIndex, {
        ...train,
        TrainNumber: trainNumber,
        Direction: direction,
        MaxSpeed: maxSpeed || undefined,
        CarCount: carCount || undefined,
      });
      setTrainNumber('');
      setDirection(1);
      setMaxSpeed('');
      setCarCount('');
      setEditingIndex(null);
      setEditDialogOpen(false);
    }
  };

  const handleOpenEdit = (index: number) => {
    const train = work.Trains[index];
    setEditingIndex(index);
    setTrainNumber(train.TrainNumber);
    setDirection(train.Direction);
    setMaxSpeed(train.MaxSpeed || '');
    setCarCount(train.CarCount || '');
    setEditDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this Train?')) {
      deleteTrain(workGroupIndex, workIndex, index);
    }
  };

  const handleNavigateToTrain = (trainIndex: number) => {
    const train = work.Trains[trainIndex];
    navigate(
      `/project/${projectId}/workgroup/${workGroupId}/work/${workId}/train/${
        train.Id || trainIndex
      }`
    );
  };

  const handleOpenClone = (index: number) => {
    setCloneTrainIndex(index);
    setCloneTrainNumber(work.Trains[index].TrainNumber + ' Copy');
    setCloneDialogOpen(true);
  };

  const handleClone = () => {
    if (cloneTrainIndex !== null && cloneTrainNumber.trim()) {
      cloneTrain(workGroupIndex, workIndex, cloneTrainIndex, cloneTrainNumber);
      setCloneDialogOpen(false);
      setCloneTrainNumber('');
      setCloneTrainIndex(null);
    }
  };

  const handleGenerateTrain = () => {
    if (!selectedPatternId) return;

    const pattern = getTrainTypePattern(selectedPatternId);
    if (!pattern) return;

    const line = getLine(pattern.lineId);
    if (!line) return;

    const timetableRows = generateTimetableFromPattern(pattern, departureTime, line, stations);

    const newTrain: Train = {
      Id: uuidv4(),
      TrainNumber: pattern.typeName,
      Direction: 1,
      TimetableRows: timetableRows,
    };

    addTrain(workGroupIndex, workIndex, newTrain);
    setGenerateDialogOpen(false);
    setSelectedPatternId('');
    setDepartureTime('08:00:00');
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
      path: `/project/${projectId}/workgroup/${workGroupId}/works`,
      siblings: workGroup.Works.map((w, idx) => ({
        label: w.Name,
        path: `/project/${projectId}/workgroup/${workGroupId}/work/${w.Id || idx}/trains`,
      })),
    },
    {
      label: work.Name,
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
        <Typography variant="h4">Trains</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setGenerateDialogOpen(true)}
            disabled={trainTypePatterns.length === 0}
          >
            Generate
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Train
          </Button>
        </Box>
      </Box>

      {work.Trains.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Trains
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Create a Train to start building your timetable.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setGenerateDialogOpen(true)}
                disabled={trainTypePatterns.length === 0}
              >
                Generate from Pattern
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create First Train
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {work.Trains.map((train, index) => (
            <Grid key={train.Id || index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                      {train.TrainNumber}
                    </Typography>
                    <Chip
                      icon={<DirectionsIcon />}
                      label={train.Direction === 1 ? 'Down' : 'Up'}
                      size="small"
                      color={train.Direction === 1 ? 'primary' : 'secondary'}
                    />
                  </Box>
                  {train.MaxSpeed && (
                    <Typography variant="body2" color="textSecondary">
                      Max Speed: {train.MaxSpeed} km/h
                    </Typography>
                  )}
                  {train.CarCount && (
                    <Typography variant="body2" color="textSecondary">
                      Car Count: {train.CarCount}
                    </Typography>
                  )}
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {train.TimetableRows.length} Stop{train.TimetableRows.length !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenEdit(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenClone(index)}>
                      <FileCopyIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => handleNavigateToTrain(index)}
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
        <DialogTitle>Create New Train</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Train Number"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
            />
            <FormControlLabel
              control={
                <Switch checked={direction === 1} onChange={(e) => setDirection(e.target.checked ? 1 : -1)} />
              }
              label={`Direction: ${direction === 1 ? 'Down (1)' : 'Up (-1)'}`}
            />
            <TextField
              fullWidth
              type="text"
              label="Max Speed (km/h)"
              value={maxSpeed}
              onChange={(e) => setMaxSpeed(e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Car Count"
              value={carCount}
              onChange={(e) => setCarCount(e.target.value ? parseInt(e.target.value) : '')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!trainNumber.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle>Edit Train</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Train Number"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
            />
            <FormControlLabel
              control={
                <Switch checked={direction === 1} onChange={(e) => setDirection(e.target.checked ? 1 : -1)} />
              }
              label={`Direction: ${direction === 1 ? 'Down (1)' : 'Up (-1)'}`}
            />
            <TextField
              fullWidth
              type="text"
              label="Max Speed (km/h)"
              value={maxSpeed}
              onChange={(e) => setMaxSpeed(e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Car Count"
              value={carCount}
              onChange={(e) => setCarCount(e.target.value ? parseInt(e.target.value) : '')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={!trainNumber.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onClose={() => setCloneDialogOpen(false)} fullWidth>
        <DialogTitle>Clone Train</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New Train Number"
            value={cloneTrainNumber}
            onChange={(e) => setCloneTrainNumber(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClone} variant="contained" disabled={!cloneTrainNumber.trim()}>
            Clone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} fullWidth>
        <DialogTitle>Generate Train from Pattern</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Train Type Pattern"
              value={selectedPatternId}
              onChange={(e) => setSelectedPatternId(e.target.value)}
            >
              {trainTypePatterns.map((pattern) => (
                <MenuItem key={pattern.id} value={pattern.id}>
                  {pattern.typeName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Departure Time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              placeholder="HH:MM:SS"
              helperText="Format: HH:MM:SS (e.g., 08:30:00)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateTrain}
            variant="contained"
            disabled={!selectedPatternId}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Station and Line Dialogs */}
      <StationDialog open={stationDialogOpen} onClose={() => setStationDialogOpen(false)} />
      <LineDialog open={lineDialogOpen} onClose={() => setLineDialogOpen(false)} />
    </Box>
  );
}
