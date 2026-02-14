import { useState, useEffect } from 'react';
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
  Typography,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DirectionsIcon from '@mui/icons-material/Directions';
import MapIcon from '@mui/icons-material/Map';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useNavigate, useParams } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { Breadcrumbs } from '../components/Navigation/Breadcrumbs';
import type { BreadcrumbItemWithSiblings } from '../components/Navigation/Breadcrumbs';
import { TimetableGrid } from '../components/TimetableEditor/TimetableGrid';
import { StationDialog } from '../components/Dialogs/StationDialog';
import { LineDialog } from '../components/Dialogs/LineDialog';

export function TrainDetailPage() {
  const navigate = useNavigate();
  const { projectId, workGroupId, workId, trainId } = useParams<{
    projectId: string;
    workGroupId: string;
    workId: string;
    trainId: string;
  }>();
  const workGroups = useDataStore((state) => state.workGroups);
  const updateTrain = useDataStore((state) => state.updateTrain);
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

  // Find workGroup, work, and train
  const workGroupIndex = workGroups.findIndex(
    (wg) => wg.Id === workGroupId || workGroups.indexOf(wg).toString() === workGroupId
  );
  const workGroup = workGroups[workGroupIndex];
  const workIndex = workGroup?.Works.findIndex(
    (w) => w.Id === workId || workGroup.Works.indexOf(w).toString() === workId
  );
  const work = workGroup?.Works[workIndex ?? -1];
  const trainIndex = work?.Trains.findIndex(
    (t) => t.Id === trainId || work.Trains.indexOf(t).toString() === trainId
  );
  const train = work?.Trains[trainIndex ?? -1];

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [trainNumber, setTrainNumber] = useState('');
  const [direction, setDirection] = useState<number>(1);
  const [maxSpeed, setMaxSpeed] = useState<string>('');
  const [carCount, setCarCount] = useState<number | ''>('');
  const [destination, setDestination] = useState('');
  const [remarks, setRemarks] = useState('');

  // For Station/Line dialogs (to be implemented)
  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);

  if (
    !workGroup ||
    !work ||
    !train ||
    workIndex === undefined ||
    workIndex === -1 ||
    trainIndex === undefined ||
    trainIndex === -1
  ) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Train not found
        </Typography>
        <Button
          onClick={() =>
            navigate(`/project/${projectId}/workgroup/${workGroupId}/work/${workId}/trains`)
          }
        >
          Back to Trains
        </Button>
      </Box>
    );
  }

  const handleOpenEdit = () => {
    setTrainNumber(train.TrainNumber);
    setDirection(train.Direction);
    setMaxSpeed(train.MaxSpeed || '');
    setCarCount(train.CarCount || '');
    setDestination(train.Destination || '');
    setRemarks(train.Remarks || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateTrain(workGroupIndex, workIndex, trainIndex, {
      ...train,
      TrainNumber: trainNumber,
      Direction: direction,
      MaxSpeed: maxSpeed || undefined,
      CarCount: carCount || undefined,
      Destination: destination || undefined,
      Remarks: remarks || undefined,
    });
    setEditDialogOpen(false);
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
      path: `/project/${projectId}/workgroup/${workGroupId}/work/${workId}/trains`,
      siblings: work.Trains.map((t, idx) => ({
        label: t.TrainNumber,
        path: `/project/${projectId}/workgroup/${workGroupId}/work/${workId}/train/${
          t.Id || idx
        }`,
      })),
    },
    {
      label: train.TrainNumber,
    },
  ];

  return (
    <Box>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Train Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h4">{train.TrainNumber}</Typography>
                <Chip
                  icon={<DirectionsIcon />}
                  label={train.Direction === 1 ? 'Down (1)' : 'Up (-1)'}
                  color={train.Direction === 1 ? 'primary' : 'secondary'}
                />
              </Box>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                {train.MaxSpeed && (
                  <Typography variant="body1" color="textSecondary">
                    <strong>Max Speed:</strong> {train.MaxSpeed} km/h
                  </Typography>
                )}
                {train.CarCount && (
                  <Typography variant="body1" color="textSecondary">
                    <strong>Cars:</strong> {train.CarCount}
                  </Typography>
                )}
                {train.Destination && (
                  <Typography variant="body1" color="textSecondary">
                    <strong>Destination:</strong> {train.Destination}
                  </Typography>
                )}
              </Stack>
              {train.Remarks && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {train.Remarks}
                </Typography>
              )}
            </Box>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEdit}>
              Edit Info
            </Button>
          </Box>
        </CardContent>
      </Card>

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

      {/* Timetable */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Timetable
          </Typography>
          <TimetableGrid
            workGroupIndex={workGroupIndex}
            workIndex={workIndex}
            trainIndex={trainIndex}
          />
        </CardContent>
      </Card>

      {/* Edit Train Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Train Information</DialogTitle>
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
                <Switch
                  checked={direction === 1}
                  onChange={(e) => setDirection(e.target.checked ? 1 : -1)}
                />
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
            <TextField
              fullWidth
              label="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <TextField
              fullWidth
              label="Remarks"
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
            onClick={handleSaveEdit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!trainNumber.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Placeholder dialogs for Stations and Lines */}
      <StationDialog open={stationDialogOpen} onClose={() => setStationDialogOpen(false)} />
      <LineDialog open={lineDialogOpen} onClose={() => setLineDialogOpen(false)} />
    </Box>
  );
}
