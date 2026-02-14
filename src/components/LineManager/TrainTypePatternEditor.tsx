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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEditorStore } from '../../store/editorStore';
import type { TrainTypePattern, TrainTypeIntervalPattern } from '../../types/editor';
import { v4 as uuidv4 } from 'uuid';

interface EditingPattern {
  patternId?: string;
  pattern: TrainTypePattern;
}

export function TrainTypePatternEditor() {
  const lines = useEditorStore((state) => state.lines);
  const stations = useEditorStore((state) => state.stations);
  const trainTypePatterns = useEditorStore((state) => state.trainTypePatterns);
  const addTrainTypePattern = useEditorStore((state) => state.addTrainTypePattern);
  const updateTrainTypePattern = useEditorStore((state) => state.updateTrainTypePattern);
  const deleteTrainTypePattern = useEditorStore((state) => state.deleteTrainTypePattern);
  const getLineStations = useEditorStore((state) => state.getLineStations);

  const [editingPattern, setEditingPattern] = useState<EditingPattern | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFromStationId, setSelectedFromStationId] = useState<string>('');
  const [selectedToStationId, setSelectedToStationId] = useState<string>('');
  const [driveTimeMinutes, setDriveTimeMinutes] = useState<number>(0);
  const [driveTimeSeconds, setDriveTimeSeconds] = useState<number>(0);

  const handleOpenEditPattern = (patternId?: string) => {
    if (patternId) {
      const pattern = trainTypePatterns.find((p) => p.id === patternId);
      if (pattern) {
        setEditingPattern({ patternId, pattern: { ...pattern, intervals: [...pattern.intervals] } });
      }
    } else {
      setEditingPattern({
        pattern: {
          id: uuidv4(),
          lineId: '',
          typeName: '',
          intervals: [],
        },
      });
    }
    setSelectedFromStationId('');
    setSelectedToStationId('');
    setDriveTimeMinutes(0);
    setDriveTimeSeconds(0);
    setEditDialogOpen(true);
  };

  const handleSavePattern = () => {
    if (!editingPattern) return;
    if (!editingPattern.pattern.typeName.trim()) return;
    if (!editingPattern.pattern.lineId) return;

    if (editingPattern.patternId) {
      updateTrainTypePattern(editingPattern.patternId, editingPattern.pattern);
    } else {
      addTrainTypePattern(editingPattern.pattern);
    }

    setEditingPattern(null);
    setEditDialogOpen(false);
  };

  const handleDeletePattern = (patternId: string) => {
    if (window.confirm('Delete this train type pattern?')) {
      deleteTrainTypePattern(patternId);
    }
  };

  const handleAddInterval = () => {
    if (!editingPattern || !selectedFromStationId || !selectedToStationId) return;

    const newInterval: TrainTypeIntervalPattern = {
      fromStationId: selectedFromStationId,
      toStationId: selectedToStationId,
      driveTime_MM: driveTimeMinutes,
      driveTime_SS: driveTimeSeconds,
    };

    const updatedIntervals = [...editingPattern.pattern.intervals, newInterval];
    setEditingPattern({
      ...editingPattern,
      pattern: { ...editingPattern.pattern, intervals: updatedIntervals },
    });

    setSelectedFromStationId('');
    setSelectedToStationId('');
    setDriveTimeMinutes(0);
    setDriveTimeSeconds(0);
  };

  const handleRemoveInterval = (index: number) => {
    if (!editingPattern) return;
    const updatedIntervals = editingPattern.pattern.intervals.filter((_, i) => i !== index);
    setEditingPattern({
      ...editingPattern,
      pattern: { ...editingPattern.pattern, intervals: updatedIntervals },
    });
  };

  const getStationName = (stationId: string) => stations.find((s) => s.id === stationId)?.name || 'Unknown';

  const lineStations = editingPattern ? getLineStations(editingPattern.pattern.lineId) : [];
  const patternsByLine = trainTypePatterns.reduce(
    (acc, pattern) => {
      if (!acc[pattern.lineId]) acc[pattern.lineId] = [];
      acc[pattern.lineId].push(pattern);
      return acc;
    },
    {} as Record<string, TrainTypePattern[]>
  );

  const patternDialog = (
    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>
        {editingPattern?.patternId ? 'Edit Train Type Pattern' : 'Create New Train Type Pattern'}
      </DialogTitle>
      <DialogContent>
        {editingPattern && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Line"
              value={editingPattern.pattern.lineId}
              onChange={(e) => {
                setEditingPattern({
                  ...editingPattern,
                  pattern: { ...editingPattern.pattern, lineId: e.target.value },
                });
              }}
            >
              {lines.map((line) => (
                <MenuItem key={line.id} value={line.id}>
                  {line.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Type Name (e.g., 普通, 急行, 特快)"
              value={editingPattern.pattern.typeName}
              onChange={(e) =>
                setEditingPattern({
                  ...editingPattern,
                  pattern: { ...editingPattern.pattern, typeName: e.target.value },
                })
              }
            />

            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Intervals ({editingPattern.pattern.intervals.length})
              </Typography>

              {editingPattern.pattern.intervals.length > 0 && (
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell width="50" align="center">
                          Del
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editingPattern.pattern.intervals.map((interval, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {getStationName(interval.fromStationId)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {getStationName(interval.toStationId)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {String(interval.driveTime_MM).padStart(2, '0')}:
                            {String(interval.driveTime_SS).padStart(2, '0')}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveInterval(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Stack spacing={1}>
                <TextField
                  select
                  fullWidth
                  label="From Station"
                  value={selectedFromStationId}
                  onChange={(e) => setSelectedFromStationId(e.target.value)}
                  size="small"
                >
                  {lineStations.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="To Station"
                  value={selectedToStationId}
                  onChange={(e) => setSelectedToStationId(e.target.value)}
                  size="small"
                >
                  {lineStations.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minutes"
                    inputProps={{ min: 0, max: 59 }}
                    value={driveTimeMinutes}
                    onChange={(e) => setDriveTimeMinutes(parseInt(e.target.value) || 0)}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Seconds"
                    inputProps={{ min: 0, max: 59 }}
                    value={driveTimeSeconds}
                    onChange={(e) => setDriveTimeSeconds(parseInt(e.target.value) || 0)}
                    size="small"
                  />
                </Stack>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddInterval}
                  disabled={!selectedFromStationId || !selectedToStationId}
                >
                  Add Interval
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleSavePattern} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (lines.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Create a line first before adding train type patterns.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(patternsByLine).length === 0) {
    return (
      <>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              No train type patterns. Create one to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenEditPattern()}
            >
              Create Pattern
            </Button>
          </CardContent>
        </Card>
        {patternDialog}
      </>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenEditPattern()}
        sx={{ mb: 2 }}
      >
        Add Pattern
      </Button>

      <Stack spacing={2}>
        {lines.map((line) => {
          const patternsForLine = patternsByLine[line.id] || [];
          if (patternsForLine.length === 0) return null;

          return (
            <Card key={line.id}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {line.name} ({patternsForLine.length} patterns)
                </Typography>

                <Stack spacing={1}>
                  {patternsForLine.map((pattern) => (
                    <Accordion key={pattern.id}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ flexGrow: 1 }}>
                          <strong>{pattern.typeName}</strong> ({pattern.intervals.length} intervals)
                        </Typography>
                        <Tooltip title="Edit Pattern">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditPattern(pattern.id);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Pattern">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePattern(pattern.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </AccordionSummary>
                      <AccordionDetails>
                        {pattern.intervals.length === 0 ? (
                          <Typography variant="body2" color="textSecondary">
                            No intervals defined
                          </Typography>
                        ) : (
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableCell>From Station</TableCell>
                                  <TableCell>To Station</TableCell>
                                  <TableCell>Time (MM:SS)</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {pattern.intervals.map((interval, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{getStationName(interval.fromStationId)}</TableCell>
                                    <TableCell>{getStationName(interval.toStationId)}</TableCell>
                                    <TableCell>
                                      {String(interval.driveTime_MM).padStart(2, '0')}:
                                      {String(interval.driveTime_SS).padStart(2, '0')}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {patternDialog}
    </Box>
  );
}
