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
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDataStore } from '../../store/dataStore';
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
    if (workIndex !== undefined) {
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
    if (!editingWork.work.Name.trim() || !editingWork.work.AffectDate.trim()) {
      return;
    }

    if (editingWork.workIndex !== undefined) {
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
      <Dialog open={editWorkDialogOpen} onClose={() => setEditWorkDialogOpen(false)} fullWidth>
        <DialogTitle>
          {editingWork?.workIndex !== undefined ? 'Edit Work' : 'Create New Work'}
        </DialogTitle>
        <DialogContent>
          {editingWork && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Work Name"
                value={editingWork.work.Name}
                onChange={(e) =>
                  setEditingWork({
                    ...editingWork,
                    work: { ...editingWork.work, Name: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Affect Date (YYYYMMDD)"
                value={editingWork.work.AffectDate}
                onChange={(e) =>
                  setEditingWork({
                    ...editingWork,
                    work: { ...editingWork.work, AffectDate: e.target.value },
                  })
                }
                placeholder="20240101"
              />
              <TextField
                fullWidth
                label="Remarks (HTML supported)"
                multiline
                rows={3}
                value={editingWork.work.Remarks || ''}
                onChange={(e) =>
                  setEditingWork({
                    ...editingWork,
                    work: { ...editingWork.work, Remarks: e.target.value },
                  })
                }
              />
            </Stack>
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
                  <List>
                    {wg.Works.map((work, workIndex) => (
                      <ListItem
                        key={work.Id || workIndex}
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit Work">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleOpenEditWork(wgIndex, workIndex)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Work">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => deleteWork(wgIndex, workIndex)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={work.Name}
                          secondary={`Affect Date: ${work.AffectDate} | Trains: ${work.Trains.length}`}
                        />
                      </ListItem>
                    ))}
                  </List>
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
