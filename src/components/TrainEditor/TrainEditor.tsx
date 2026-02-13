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
  FormControlLabel,
  Switch,
  Grid,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDataStore } from '../../store/dataStore';
import { useEditorStore } from '../../store/editorStore';
import type { Train } from '../../types/trvis';
import { TimetableGrid } from '../TimetableEditor/TimetableGrid';
import { generateTimetableFromPattern } from '../../utils/trainGenerator';
import { v4 as uuidv4 } from 'uuid';

interface TrainEditorProps {
  workGroupIndex: number;
  workIndex: number;
}

interface EditingTrain {
  trainIndex?: number;
  train: Train;
}

export function TrainEditor({ workGroupIndex, workIndex }: TrainEditorProps) {
  const getWork = useDataStore((state) => state.getWork);
  const addTrain = useDataStore((state) => state.addTrain);
  const updateTrain = useDataStore((state) => state.updateTrain);
  const deleteTrain = useDataStore((state) => state.deleteTrain);
  const cloneTrain = useDataStore((state) => state.cloneTrain);

  const trainTypePatterns = useEditorStore((state) => state.trainTypePatterns);
  const stations = useEditorStore((state) => state.stations);
  const getLine = useEditorStore((state) => state.getLine);
  const getTrainTypePattern = useEditorStore((state) => state.getTrainTypePattern);

  const work = getWork(workGroupIndex, workIndex);
  const [editingTrain, setEditingTrain] = useState<EditingTrain | null>(null);
  const [editTrainDialogOpen, setEditTrainDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneTrainIndex, setCloneTrainIndex] = useState<number | null>(null);
  const [cloneTrainNumber, setCloneTrainNumber] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState<string>('');
  const [departureTime, setDepartureTime] = useState('08:00:00');

  if (!work) {
    return <Box>Work not found</Box>;
  }

  const handleOpenEditTrain = (trainIndex?: number) => {
    if (trainIndex !== undefined) {
      const train = work.Trains[trainIndex];
      if (train) {
        setEditingTrain({ trainIndex, train: { ...train } });
      }
    } else {
      setEditingTrain({
        train: {
          TrainNumber: '',
          Direction: 1,
          TimetableRows: [],
        },
      });
    }
    setEditTrainDialogOpen(true);
  };

  const handleSaveTrain = () => {
    if (!editingTrain) return;
    if (!editingTrain.train.TrainNumber.trim()) {
      return;
    }

    if (editingTrain.trainIndex !== undefined) {
      updateTrain(workGroupIndex, workIndex, editingTrain.trainIndex, editingTrain.train);
    } else {
      addTrain(workGroupIndex, workIndex, {
        ...editingTrain.train,
        Id: uuidv4(),
      });
    }

    setEditingTrain(null);
    setEditTrainDialogOpen(false);
  };

  const handleCloneTrain = () => {
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

  if (work.Trains.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No trains in this work. Create one to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenEditTrain()}
          >
            Create Train
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenEditTrain()}
        >
          Add Train
        </Button>
        <Button
          variant="outlined"
          onClick={() => setGenerateDialogOpen(true)}
          disabled={trainTypePatterns.length === 0}
        >
          Generate from Pattern
        </Button>
      </Stack>

      <Stack spacing={2}>
        {work.Trains.map((train, trainIndex) => (
          <Accordion key={train.Id || trainIndex}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ flexGrow: 1 }}>
                <strong>{train.TrainNumber}</strong> ({train.TimetableRows.length} stops)
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Clone Train">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCloneTrainIndex(trainIndex);
                      setCloneTrainNumber('');
                      setCloneDialogOpen(true);
                    }}
                  >
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Train">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditTrain(trainIndex);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Train">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTrain(workGroupIndex, workIndex, trainIndex);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2">
                      <strong>Train Number:</strong> {train.TrainNumber}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2">
                      <strong>Direction:</strong> {train.Direction === 1 ? 'Descending' : 'Ascending'}
                    </Typography>
                  </Grid>
                  {train.MaxSpeed && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2">
                        <strong>Max Speed:</strong> {train.MaxSpeed} km/h
                      </Typography>
                    </Grid>
                  )}
                  {train.CarCount && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2">
                        <strong>Car Count:</strong> {train.CarCount}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Timetable Rows ({train.TimetableRows.length})
                </Typography>
                <TimetableGrid
                  workGroupIndex={workGroupIndex}
                  workIndex={workIndex}
                  trainIndex={trainIndex}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      {/* Edit Train Dialog */}
      <Dialog open={editTrainDialogOpen} onClose={() => setEditTrainDialogOpen(false)} fullWidth>
        <DialogTitle>
          {editingTrain?.trainIndex !== undefined ? 'Edit Train' : 'Create New Train'}
        </DialogTitle>
        <DialogContent>
          {editingTrain && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Train Number"
                value={editingTrain.train.TrainNumber}
                onChange={(e) =>
                  setEditingTrain({
                    ...editingTrain,
                    train: { ...editingTrain.train, TrainNumber: e.target.value },
                  })
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editingTrain.train.Direction === 1}
                    onChange={(e) =>
                      setEditingTrain({
                        ...editingTrain,
                        train: {
                          ...editingTrain.train,
                          Direction: e.target.checked ? 1 : -1,
                        },
                      })
                    }
                  />
                }
                label="Direction: Descending (1) / Ascending (-1)"
              />
              <TextField
                fullWidth
                type="number"
                label="Max Speed (km/h)"
                value={editingTrain.train.MaxSpeed || ''}
                onChange={(e) =>
                  setEditingTrain({
                    ...editingTrain,
                    train: {
                      ...editingTrain.train,
                      MaxSpeed: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
              />
              <TextField
                fullWidth
                type="number"
                label="Car Count"
                value={editingTrain.train.CarCount || ''}
                onChange={(e) =>
                  setEditingTrain({
                    ...editingTrain,
                    train: {
                      ...editingTrain.train,
                      CarCount: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    },
                  })
                }
              />
              <TextField
                fullWidth
                label="Destination"
                value={editingTrain.train.Destination || ''}
                onChange={(e) =>
                  setEditingTrain({
                    ...editingTrain,
                    train: { ...editingTrain.train, Destination: e.target.value },
                  })
                }
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTrainDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTrain} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Train Dialog */}
      <Dialog open={cloneDialogOpen} onClose={() => setCloneDialogOpen(false)} fullWidth>
        <DialogTitle>Clone Train</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New Train Number"
            value={cloneTrainNumber}
            onChange={(e) => setCloneTrainNumber(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCloneTrain();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCloneTrain}
            variant="contained"
            disabled={!cloneTrainNumber.trim()}
          >
            Clone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Train from Pattern Dialog */}
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
              {trainTypePatterns.map((pattern) => {
                const line = getLine(pattern.lineId);
                return (
                  <MenuItem key={pattern.id} value={pattern.id}>
                    {line?.name} - {pattern.typeName}
                  </MenuItem>
                );
              })}
            </TextField>

            <TextField
              fullWidth
              label="Departure Time (HH:MM:SS)"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              placeholder="08:00:00"
            />

            {selectedPatternId && (
              <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  This will generate a new train with the pattern's schedule starting at the specified
                  time.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateTrain}
            variant="contained"
            disabled={!selectedPatternId || !departureTime}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
