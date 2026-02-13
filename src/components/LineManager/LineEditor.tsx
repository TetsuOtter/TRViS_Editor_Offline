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
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useEditorStore } from '../../store/editorStore';
import type { Line, LineStation } from '../../types/editor';
import { v4 as uuidv4 } from 'uuid';

interface EditingLine {
  lineId?: string;
  line: Line;
}

export function LineEditor() {
  const lines = useEditorStore((state) => state.lines);
  const stations = useEditorStore((state) => state.stations);
  const addLine = useEditorStore((state) => state.addLine);
  const updateLine = useEditorStore((state) => state.updateLine);
  const deleteLine = useEditorStore((state) => state.deleteLine);

  const [editingLine, setEditingLine] = useState<EditingLine | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [selectedDistance, setSelectedDistance] = useState<number>(0);

  const handleOpenEditLine = (lineId?: string) => {
    if (lineId) {
      const line = lines.find((l) => l.id === lineId);
      if (line) {
        setEditingLine({ lineId, line: { ...line, stations: [...line.stations] } });
      }
    } else {
      setEditingLine({
        line: {
          id: uuidv4(),
          name: '',
          stations: [],
        },
      });
    }
    setSelectedStationId('');
    setSelectedDistance(0);
    setEditDialogOpen(true);
  };

  const handleSaveLine = () => {
    if (!editingLine) return;
    if (!editingLine.line.name.trim()) return;

    if (editingLine.lineId) {
      updateLine(editingLine.lineId, editingLine.line);
    } else {
      addLine(editingLine.line);
    }

    setEditingLine(null);
    setEditDialogOpen(false);
  };

  const handleDeleteLine = (lineId: string) => {
    if (window.confirm('Delete this line? Associated train type patterns will also be deleted.')) {
      deleteLine(lineId);
    }
  };

  const handleAddStationToLine = () => {
    if (!editingLine || !selectedStationId) return;

    const newLineStation: LineStation = {
      stationId: selectedStationId,
      distanceFromStart_m: selectedDistance,
    };

    const updatedStations = [...editingLine.line.stations, newLineStation];
    setEditingLine({
      ...editingLine,
      line: { ...editingLine.line, stations: updatedStations },
    });

    setSelectedStationId('');
    setSelectedDistance(0);
  };

  const handleRemoveStationFromLine = (index: number) => {
    if (!editingLine) return;
    const updatedStations = editingLine.line.stations.filter((_, i) => i !== index);
    setEditingLine({
      ...editingLine,
      line: { ...editingLine.line, stations: updatedStations },
    });
  };

  const handleMoveStation = (index: number, direction: 'up' | 'down') => {
    if (!editingLine) return;
    const stations = [...editingLine.line.stations];
    if (direction === 'up' && index > 0) {
      [stations[index], stations[index - 1]] = [stations[index - 1], stations[index]];
    } else if (direction === 'down' && index < stations.length - 1) {
      [stations[index], stations[index + 1]] = [stations[index + 1], stations[index]];
    }
    setEditingLine({
      ...editingLine,
      line: { ...editingLine.line, stations },
    });
  };

  const getStationName = (stationId: string) => {
    return stations.find((s) => s.id === stationId)?.name || 'Unknown';
  };

  if (lines.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No lines. Create one to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenEditLine()}
          >
            Create Line
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenEditLine()}
        sx={{ mb: 2 }}
      >
        Add Line
      </Button>

      <Stack spacing={2}>
        {lines.map((line) => (
          <Accordion key={line.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ flexGrow: 1 }}>
                <strong>{line.name}</strong> ({line.stations.length} stations)
              </Typography>
              <Tooltip title="Edit Line">
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditLine(line.id);
                }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Line">
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteLine(line.id);
                }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
                {line.stations.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No stations on this line
                  </Typography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Order</TableCell>
                          <TableCell>Station Name</TableCell>
                          <TableCell>Distance (m)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {line.stations.map((ls, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{getStationName(ls.stationId)}</TableCell>
                            <TableCell>{ls.distanceFromStart_m}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

      {/* Edit Line Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingLine?.lineId ? 'Edit Line' : 'Create New Line'}
        </DialogTitle>
        <DialogContent>
          {editingLine && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Line Name"
                value={editingLine.line.name}
                onChange={(e) =>
                  setEditingLine({
                    ...editingLine,
                    line: { ...editingLine.line, name: e.target.value },
                  })
                }
              />

              <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Stations ({editingLine.line.stations.length})
                </Typography>

                {editingLine.line.stations.length > 0 && (
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ width: 40 }}>No.</TableCell>
                          <TableCell sx={{ flex: 1 }}>Station</TableCell>
                          <TableCell sx={{ width: 80 }}>Dist (m)</TableCell>
                          <TableCell sx={{ width: 80 }} align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editingLine.line.stations.map((ls, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{getStationName(ls.stationId)}</TableCell>
                            <TableCell>{ls.distanceFromStart_m}</TableCell>
                            <TableCell align="center">
                              <Tooltip title="Move up">
                                <IconButton
                                  size="small"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveStation(idx, 'up')}
                                >
                                  <KeyboardArrowUpIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Move down">
                                <IconButton
                                  size="small"
                                  disabled={idx === editingLine.line.stations.length - 1}
                                  onClick={() => handleMoveStation(idx, 'down')}
                                >
                                  <KeyboardArrowDownIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveStationFromLine(idx)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
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
                    label="Add Station"
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    size="small"
                  >
                    {stations
                      .filter((s) => !editingLine.line.stations.some((ls) => ls.stationId === s.id))
                      .map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                  </TextField>
                  <TextField
                    fullWidth
                    type="number"
                    label="Distance from Start (m)"
                    value={selectedDistance}
                    onChange={(e) => setSelectedDistance(parseFloat(e.target.value) || 0)}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddStationToLine}
                    disabled={!selectedStationId}
                  >
                    Add Station
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveLine} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
