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
  Stack,
  Typography,
  IconButton,
  Grid,
  Tabs,
  Tab,
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
import { FormField } from '../components/FormFields/TRViSFormFields';
import { createDefaultTRViSConfiguration } from '../types/trvisconfiguration';
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
  const [editTabIndex, setEditTabIndex] = useState(0);
  const [workName, setWorkName] = useState('');
  const [affectDate, setAffectDate] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState('');
  const [affixContentType, setAffixContentType] = useState<number | undefined>(undefined);
  const [affixContent, setAffixContent] = useState('');
  const [hasETrainTimetable, setHasETrainTimetable] = useState(false);
  const [eTrainTimetableContentType, setETrainTimetableContentType] = useState<number | undefined>(undefined);
  const [eTrainTimetableContent, setETrainTimetableContent] = useState('');
  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);

  const workConfig = createDefaultTRViSConfiguration().work;

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
    if (workName.trim()) {
      const newWork: Work = {
        Id: uuidv4(),
        Name: workName,
        AffectDate: affectDate,
        Remarks: remarks,
        AffixContentType: affixContentType,
        AffixContent: affixContent || undefined,
        HasETrainTimetable: hasETrainTimetable || undefined,
        ETrainTimetableContentType: eTrainTimetableContentType,
        ETrainTimetableContent: eTrainTimetableContent || undefined,
        Trains: [],
      };
      addWork(workGroupIndex, newWork);
      setWorkName('');
      setAffectDate(undefined);
      setRemarks('');
      setAffixContentType(undefined);
      setAffixContent('');
      setHasETrainTimetable(false);
      setETrainTimetableContentType(undefined);
      setETrainTimetableContent('');
      setEditTabIndex(0);
      setCreateDialogOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingIndex !== null && workName.trim()) {
      const work = workGroup.Works[editingIndex];
      updateWork(workGroupIndex, editingIndex, {
        ...work,
        Name: workName,
        AffectDate: affectDate,
        Remarks: remarks,
        AffixContentType: affixContentType,
        AffixContent: affixContent || undefined,
        HasETrainTimetable: hasETrainTimetable || undefined,
        ETrainTimetableContentType: eTrainTimetableContentType,
        ETrainTimetableContent: eTrainTimetableContent || undefined,
      });
      setWorkName('');
      setAffectDate(undefined);
      setRemarks('');
      setAffixContentType(undefined);
      setAffixContent('');
      setHasETrainTimetable(false);
      setETrainTimetableContentType(undefined);
      setETrainTimetableContent('');
      setEditingIndex(null);
      setEditTabIndex(0);
      setEditDialogOpen(false);
    }
  };

  const handleOpenEdit = (index: number) => {
    const work = workGroup.Works[index];
    setEditingIndex(index);
    setWorkName(work.Name);
    setAffectDate(work.AffectDate);
    setRemarks(work.Remarks || '');
    setAffixContentType(work.AffixContentType);
    setAffixContent(work.AffixContent || '');
    setHasETrainTimetable(work.HasETrainTimetable || false);
    setETrainTimetableContentType(work.ETrainTimetableContentType);
    setETrainTimetableContent(work.ETrainTimetableContent || '');
    setEditTabIndex(0);
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
          data-testid="create-work-button"
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
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Work</DialogTitle>
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
                    label="Work Name"
                    value={workName}
                    onChange={(value) => setWorkName(value)}
                    config={workConfig.name || { enabled: true, required: true, description: '' }}
                  />
                  <FormField
                    label="Affect Date"
                    value={affectDate || ''}
                    onChange={(value) => setAffectDate(value)}
                    type="text"
                    config={workConfig.affectDate || { enabled: true, required: false, description: '', format: 'YYYYMMDD' }}
                    placeholder="20240101"
                  />
                  <FormField
                    label="Remarks"
                    value={remarks}
                    onChange={(value) => setRemarks(value)}
                    type="textarea"
                    config={workConfig.remarks || { enabled: true, required: false, description: '' }}
                  />
                </Stack>
              )}

              {editTabIndex === 1 && (
                <Stack spacing={2}>
                  <FormField
                    label="Affix Content Type"
                    value={affixContentType || ''}
                    onChange={(value) => setAffixContentType(value)}
                    type="number"
                    config={workConfig.affixContentType || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Affix Content"
                    value={affixContent}
                    onChange={(value) => setAffixContent(value)}
                    type="textarea"
                    config={workConfig.affixContent || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Has E-Train Timetable"
                    value={hasETrainTimetable}
                    onChange={(value) => setHasETrainTimetable(value)}
                    type="boolean"
                    config={workConfig.hasETrainTimetable || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="E-Train Timetable Content Type"
                    value={eTrainTimetableContentType || ''}
                    onChange={(value) => setETrainTimetableContentType(value)}
                    type="number"
                    config={workConfig.eTrainTimetableContentType || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="E-Train Timetable Content"
                    value={eTrainTimetableContent}
                    onChange={(value) => setETrainTimetableContent(value)}
                    type="textarea"
                    config={workConfig.eTrainTimetableContent || { enabled: true, required: false, description: '' }}
                  />
                </Stack>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!workName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Work</DialogTitle>
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
                    label="Work Name"
                    value={workName}
                    onChange={(value) => setWorkName(value)}
                    config={workConfig.name || { enabled: true, required: true, description: '' }}
                  />
                  <FormField
                    label="Affect Date"
                    value={affectDate || ''}
                    onChange={(value) => setAffectDate(value)}
                    type="text"
                    config={workConfig.affectDate || { enabled: true, required: false, description: '', format: 'YYYYMMDD' }}
                    placeholder="20240101"
                  />
                  <FormField
                    label="Remarks"
                    value={remarks}
                    onChange={(value) => setRemarks(value)}
                    type="textarea"
                    config={workConfig.remarks || { enabled: true, required: false, description: '' }}
                  />
                </Stack>
              )}

              {editTabIndex === 1 && (
                <Stack spacing={2}>
                  <FormField
                    label="Affix Content Type"
                    value={affixContentType || ''}
                    onChange={(value) => setAffixContentType(value)}
                    type="number"
                    config={workConfig.affixContentType || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Affix Content"
                    value={affixContent}
                    onChange={(value) => setAffixContent(value)}
                    type="textarea"
                    config={workConfig.affixContent || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="Has E-Train Timetable"
                    value={hasETrainTimetable}
                    onChange={(value) => setHasETrainTimetable(value)}
                    type="boolean"
                    config={workConfig.hasETrainTimetable || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="E-Train Timetable Content Type"
                    value={eTrainTimetableContentType || ''}
                    onChange={(value) => setETrainTimetableContentType(value)}
                    type="number"
                    config={workConfig.eTrainTimetableContentType || { enabled: true, required: false, description: '' }}
                  />
                  <FormField
                    label="E-Train Timetable Content"
                    value={eTrainTimetableContent}
                    onChange={(value) => setETrainTimetableContent(value)}
                    type="textarea"
                    config={workConfig.eTrainTimetableContent || { enabled: true, required: false, description: '' }}
                  />
                </Stack>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={!workName.trim()}
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
