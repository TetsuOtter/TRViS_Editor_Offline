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
  Stack,
  Typography,
  Chip,
  Tabs,
  Tab,
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
import { FormField } from '../components/FormFields/TRViSFormFields';
import { createDefaultTRViSConfiguration } from '../types/trvisconfiguration';

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
  const [editTabIndex, setEditTabIndex] = useState(0);
  const [trainNumber, setTrainNumber] = useState('');
  const [direction, setDirection] = useState<number>(1);
  const [maxSpeed, setMaxSpeed] = useState<string>('');
  const [carCount, setCarCount] = useState<number | ''>('');
  const [destination, setDestination] = useState('');
  const [remarks, setRemarks] = useState('');
  // Advanced properties
  const [speedType, setSpeedType] = useState<string>('');
  const [nominalTractiveCapacity, setNominalTractiveCapacity] = useState<string>('');
  const [workType, setWorkType] = useState<number | ''>('');
  const [dayCount, setDayCount] = useState<number | ''>('');
  const [isRideOnMoving, setIsRideOnMoving] = useState(false);
  const [color, setColor] = useState<string>('');
  const [beginRemarks, setBeginRemarks] = useState<string>('');
  const [afterRemarks, setAfterRemarks] = useState<string>('');
  const [trainInfo, setTrainInfo] = useState<string>('');
  const [beforeDeparture, setBeforeDeparture] = useState<string>('');
  const [afterArrive, setAfterArrive] = useState<string>('');
  const [nextTrainId, setNextTrainId] = useState<string>('');

  // For Station/Line dialogs (to be implemented)
  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);

  const trainConfig = createDefaultTRViSConfiguration().train;

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
    // Advanced properties
    setSpeedType(train.SpeedType || '');
    setNominalTractiveCapacity(train.NominalTractiveCapacity || '');
    setWorkType(train.WorkType || '');
    setDayCount(train.DayCount || '');
    setIsRideOnMoving(train.IsRideOnMoving || false);
    setColor(train.Color || '');
    setBeginRemarks(train.BeginRemarks || '');
    setAfterRemarks(train.AfterRemarks || '');
    setTrainInfo(train.TrainInfo || '');
    setBeforeDeparture(train.BeforeDeparture || '');
    setAfterArrive(train.AfterArrive || '');
    setNextTrainId(train.NextTrainId || '');
    setEditTabIndex(0);
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
      // Advanced properties
      SpeedType: speedType || undefined,
      NominalTractiveCapacity: nominalTractiveCapacity || undefined,
      WorkType: workType || undefined,
      DayCount: dayCount || undefined,
      IsRideOnMoving: isRideOnMoving || undefined,
      Color: color || undefined,
      BeginRemarks: beginRemarks || undefined,
      AfterRemarks: afterRemarks || undefined,
      TrainInfo: trainInfo || undefined,
      BeforeDeparture: beforeDeparture || undefined,
      AfterArrive: afterArrive || undefined,
      NextTrainId: nextTrainId || undefined,
    });
    setEditTabIndex(0);
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
          <Box sx={{ mt: 2 }}>
            <Tabs value={editTabIndex} onChange={(_, value) => setEditTabIndex(value)}>
              <Tab label="Basic" />
              <Tab label="Advanced" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {editTabIndex === 0 && (
                <Stack spacing={2}>
                  <FormField
                    label="Train Number"
                    value={trainNumber}
                    onChange={(value) => setTrainNumber(value)}
                    config={trainConfig.trainNumber || { enabled: true, required: true, description: '' }}
                  />
                  <FormField
                    label="Direction"
                    value={direction}
                    onChange={(value) => setDirection(value)}
                    type="number"
                    config={trainConfig.direction || { enabled: true, required: true, description: '' }}
                  />
                  <FormField
                    label="Max Speed"
                    value={maxSpeed}
                    onChange={(value) => setMaxSpeed(value)}
                    type="text"
                    config={trainConfig.maxSpeed || { enabled: true, required: false, description: '', unit: 'km/h' }}
                  />
                  <FormField
                    label="Car Count"
                    value={carCount}
                    onChange={(value) => setCarCount(value)}
                    type="number"
                    config={trainConfig.carCount || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Destination"
                    value={destination}
                    onChange={(value) => setDestination(value)}
                    config={trainConfig.destination || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Remarks"
                    value={remarks}
                    onChange={(value) => setRemarks(value)}
                    type="textarea"
                    config={trainConfig.remarks || { enabled: true, required: false, description: '' }}
                  />
                </Stack>
              )}

              {editTabIndex === 1 && (
                <Stack spacing={2}>
                  <FormField
                    label="Speed Type"
                    value={speedType}
                    onChange={(value) => setSpeedType(value)}
                    type="text"
                    config={trainConfig.speedType || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Nominal Tractive Capacity"
                    value={nominalTractiveCapacity}
                    onChange={(value) => setNominalTractiveCapacity(value)}
                    type="text"
                    config={trainConfig.nominalTractiveCapacity || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Work Type"
                    value={workType}
                    onChange={(value) => setWorkType(value)}
                    type="number"
                    config={trainConfig.workType || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Day Count"
                    value={dayCount}
                    onChange={(value) => setDayCount(value)}
                    type="number"
                    config={trainConfig.dayCount || { enabled: true, required: false, description: '', min: 0 }}
                  />
                  <FormField
                    label="Is Ride On Moving"
                    value={isRideOnMoving}
                    onChange={(value) => setIsRideOnMoving(value)}
                    type="boolean"
                    config={trainConfig.isRideOnMoving || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Color"
                    value={color}
                    onChange={(value) => setColor(value)}
                    type="color"
                    config={trainConfig.color || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Begin Remarks"
                    value={beginRemarks}
                    onChange={(value) => setBeginRemarks(value)}
                    type="textarea"
                    config={trainConfig.beginRemarks || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="After Remarks"
                    value={afterRemarks}
                    onChange={(value) => setAfterRemarks(value)}
                    type="textarea"
                    config={trainConfig.afterRemarks || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Train Info"
                    value={trainInfo}
                    onChange={(value) => setTrainInfo(value)}
                    type="textarea"
                    config={trainConfig.trainInfo || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Before Departure"
                    value={beforeDeparture}
                    onChange={(value) => setBeforeDeparture(value)}
                    type="text"
                    config={trainConfig.beforeDeparture || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="After Arrive"
                    value={afterArrive}
                    onChange={(value) => setAfterArrive(value)}
                    type="text"
                    config={trainConfig.afterArrive || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Next Train ID"
                    value={nextTrainId}
                    onChange={(value) => setNextTrainId(value)}
                    type="text"
                    config={trainConfig.nextTrainId || { enabled: true, required: false, description: '' }}
                  />
                </Stack>
              )}
            </Box>
          </Box>
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
