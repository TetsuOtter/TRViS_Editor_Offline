import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
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
  Box,
  MenuItem,
  Typography,
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

interface LineDialogProps {
  open: boolean;
  onClose: () => void;
}

interface EditingLine {
  lineId?: string;
  line: Line;
}

export function LineDialog({ open, onClose }: LineDialogProps) {
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

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Line Editor
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenEditLine()}
              size="small"
            >
              Add Line
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
          {lines.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="textSecondary" paragraph>
                No lines defined. Add one to get started.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenEditLine()}
              >
                Add First Line
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {lines.map((line) => (
                <Accordion key={line.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography sx={{ flexGrow: 1 }}>{line.name}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                        {line.stations.length} stations
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEditLine(line.id)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLine(line.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {line.stations.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Order</TableCell>
                                <TableCell>Station</TableCell>
                                <TableCell align="right">Distance (m)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {line.stations.map((ls, index) => (
                                <TableRow key={index}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{getStationName(ls.stationId)}</TableCell>
                                  <TableCell align="right">{ls.distanceFromStart_m}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No stations on this line.
                        </Typography>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Line Sub-Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingLine?.lineId ? 'Edit Line' : 'Create New Line'}
        </DialogTitle>
        <DialogContent>
          {editingLine && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                autoFocus
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

              {/* Add Station to Line */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Add Station
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    select
                    label="Station"
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    size="small"
                  >
                    {stations.map((station) => (
                      <MenuItem key={station.id} value={station.id}>
                        {station.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    type="number"
                    label="Distance (m)"
                    value={selectedDistance}
                    onChange={(e) => setSelectedDistance(parseFloat(e.target.value) || 0)}
                    sx={{ width: 150 }}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddStationToLine}
                    disabled={!selectedStationId}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Stack>
              </Box>

              {/* Stations List */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Stations on Line ({editingLine.line.stations.length})
                </Typography>
                {editingLine.line.stations.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No stations added yet.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order</TableCell>
                          <TableCell>Station</TableCell>
                          <TableCell align="right">Distance (m)</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editingLine.line.stations.map((ls, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{getStationName(ls.stationId)}</TableCell>
                            <TableCell align="right">{ls.distanceFromStart_m}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Move Up">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveStation(index, 'up')}
                                    disabled={index === 0}
                                  >
                                    <KeyboardArrowUpIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move Down">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveStation(index, 'down')}
                                    disabled={index === editingLine.line.stations.length - 1}
                                  >
                                    <KeyboardArrowDownIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Remove">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveStationFromLine(index)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveLine}
            variant="contained"
            disabled={!editingLine?.line.name.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
