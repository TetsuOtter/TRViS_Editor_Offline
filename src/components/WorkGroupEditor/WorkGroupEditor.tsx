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
  Typography,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDataStore } from '../../store/dataStore';
import { createDefaultTRViSConfiguration } from '../../types/trvisconfiguration';
import { FormField } from '../FormFields/TRViSFormFields';
import { TrainEditor } from '../TrainEditor/TrainEditor';
import type { WorkGroup, Work } from '../../types/trvis';
import { v4 as uuidv4 } from 'uuid';

interface EditingWork {
  workGroupIndex: number;
  workIndex?: number;
  work: Work;
}

export function WorkGroupEditor() {
  const workGroups = useDataStore((state) => state.workGroups);
  const addWorkGroup = useDataStore((state) => state.addWorkGroup);
  const deleteWorkGroup = useDataStore((state) => state.deleteWorkGroup);
  const addWork = useDataStore((state) => state.addWork);
  const updateWork = useDataStore((state) => state.updateWork);
  const deleteWork = useDataStore((state) => state.deleteWork);

  const [newWGName, setNewWGName] = useState('');
  const [createWGDialogOpen, setCreateWGDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<EditingWork | null>(null);
  const [editWorkDialogOpen, setEditWorkDialogOpen] = useState(false);
  const [editWorkTabIndex, setEditWorkTabIndex] = useState(0);

  const workConfig = createDefaultTRViSConfiguration().work;

  const handleCreateWorkGroup = () => {
    if (newWGName.trim()) {
      const newWG: WorkGroup = {
        Id: uuidv4(),
        Name: newWGName,
        Works: [],
      };
      addWorkGroup(newWG);
      setNewWGName('');
      setCreateWGDialogOpen(false);
    }
  };

  const handleOpenEditWork = (workGroupIndex: number, workIndex?: number) => {
    if (workIndex != null) {
      const work = workGroups[workGroupIndex]?.Works[workIndex];
      if (work) {
        setEditingWork({ workGroupIndex, workIndex, work: { ...work } });
      }
    } else {
      setEditingWork({
        workGroupIndex,
        work: { Name: '', AffectDate: '', Trains: [] },
      });
    }
    setEditWorkDialogOpen(true);
  };

  const handleSaveWork = () => {
    if (!editingWork) return;
    if (!editingWork.work.Name.trim()) {
      return;
    }
    if (editingWork.work.AffectDate != null && !editingWork.work.AffectDate.trim()) {
      return;
    }

    if (editingWork.workIndex != null) {
      updateWork(editingWork.workGroupIndex, editingWork.workIndex, editingWork.work);
    } else {
      addWork(editingWork.workGroupIndex, {
        ...editingWork.work,
        Id: uuidv4(),
      });
    }

    setEditingWork(null);
    setEditWorkDialogOpen(false);
  };

  const dialogs = (
    <>
      {/* Create WorkGroup Dialog */}
      <Dialog open={createWGDialogOpen} onClose={() => setCreateWGDialogOpen(false)} fullWidth>
        <DialogTitle>Create New WorkGroup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="WorkGroup Name"
            value={newWGName}
            onChange={(e) => setNewWGName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateWorkGroup();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateWGDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWorkGroup}
            variant="contained"
            disabled={!newWGName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Work Dialog */}
      <Dialog open={editWorkDialogOpen} onClose={() => setEditWorkDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingWork?.workIndex != null ? 'Edit Work' : 'Create New Work'}
        </DialogTitle>
        <DialogContent>
          {editingWork && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={editWorkTabIndex} onChange={(_, value) => setEditWorkTabIndex(value)}>
                <Tab label="Basic" />
                <Tab label="Advanced" />
              </Tabs>

              <Box sx={{ mt: 2 }}>
                {editWorkTabIndex === 0 && (
                  <Stack spacing={2}>
                    <FormField
                      label="Work Name"
                      value={editingWork.work.Name}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, Name: value },
                        })
                      }
                      config={workConfig.name || { enabled: true, required: true, description: '' }}
                    />
                    <FormField
                      label="Affect Date"
                      value={editingWork.work.AffectDate || ''}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, AffectDate: value },
                        })
                      }
                      type="text"
                      config={workConfig.affectDate || { enabled: true, required: false, description: '', format: 'YYYYMMDD' }}
                      placeholder="20240101"
                    />
                    <FormField
                      label="Remarks"
                      value={editingWork.work.Remarks || ''}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, Remarks: value },
                        })
                      }
                      type="textarea"
                      config={workConfig.remarks || { enabled: true, required: false, description: '' }}
                    />
                  </Stack>
                )}

                {editWorkTabIndex === 1 && (
                  <Stack spacing={2}>
                    <FormField
                      label="Affix Content Type"
                      value={editingWork.work.AffixContentType || ''}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, AffixContentType: value },
                        })
                      }
                      type="number"
                      config={workConfig.affixContentType || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Affix Content"
                      value={editingWork.work.AffixContent || ''}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, AffixContent: value },
                        })
                      }
                      type="textarea"
                      config={workConfig.affixContent || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Has E-Train Timetable"
                      value={editingWork.work.HasETrainTimetable || false}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, HasETrainTimetable: value },
                        })
                      }
                      type="boolean"
                      config={workConfig.hasETrainTimetable || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="E-Train Timetable Content Type"
                      value={editingWork.work.ETrainTimetableContentType || ''}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, ETrainTimetableContentType: value },
                        })
                      }
                      type="number"
                      config={workConfig.eTrainTimetableContentType || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="E-Train Timetable Content"
                      value={editingWork.work.ETrainTimetableContent || ''}
                      onChange={(value) =>
                        setEditingWork({
                          ...editingWork,
                          work: { ...editingWork.work, ETrainTimetableContent: value },
                        })
                      }
                      type="textarea"
                      config={workConfig.eTrainTimetableContent || { enabled: true, required: false, description: '' }}
                    />
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWorkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWork} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (workGroups.length === 0) {
    return (
      <>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              No work groups. Create one to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateWGDialogOpen(true)}
            >
              Create WorkGroup
            </Button>
          </CardContent>
        </Card>
        {dialogs}
      </>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setCreateWGDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        Add WorkGroup
      </Button>

      <Stack spacing={2}>
        {workGroups.map((wg, wgIndex) => (
          <Accordion key={wg.Id || wgIndex}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ flexGrow: 1 }}>
                {wg.Name} ({wg.Works.length} works)
              </Typography>
              <Tooltip title="Delete WorkGroup">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteWorkGroup(wgIndex);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenEditWork(wgIndex)}
                >
                  Add Work
                </Button>

                {wg.Works.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No works
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {wg.Works.map((work, workIndex) => (
                      <Accordion
                        key={work.Id || workIndex}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1">{work.Name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                Affect Date: {work.AffectDate} | Trains: {work.Trains.length}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Edit Work">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditWork(wgIndex, workIndex);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Work">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteWork(wgIndex, workIndex);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              Trains
                            </Typography>
                            <TrainEditor workGroupIndex={wgIndex} workIndex={workIndex} />
                          </Paper>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      {dialogs}
    </Box>
  );
}
