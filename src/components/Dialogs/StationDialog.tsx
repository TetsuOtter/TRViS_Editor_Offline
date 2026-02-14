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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useEditorStore } from '../../store/editorStore';
import type { Station } from '../../types/editor';
import { v4 as uuidv4 } from 'uuid';

interface StationDialogProps {
  open: boolean;
  onClose: () => void;
}

interface EditingStation {
  stationId?: string;
  station: Station;
}

export function StationDialog({ open, onClose }: StationDialogProps) {
  const stations = useEditorStore((state) => state.stations);
  const addStation = useEditorStore((state) => state.addStation);
  const updateStation = useEditorStore((state) => state.updateStation);
  const deleteStation = useEditorStore((state) => state.deleteStation);

  const [editingStation, setEditingStation] = useState<EditingStation | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleOpenEditStation = (stationId?: string) => {
    if (stationId) {
      const station = stations.find((s) => s.id === stationId);
      if (station) {
        setEditingStation({ stationId, station: { ...station } });
      }
    } else {
      setEditingStation({
        station: {
          id: uuidv4(),
          name: '',
          fullName: '',
          longitude: undefined,
          latitude: undefined,
        },
      });
    }
    setEditDialogOpen(true);
  };

  const handleSaveStation = () => {
    if (!editingStation) return;
    if (!editingStation.station.name.trim()) return;

    if (editingStation.stationId) {
      updateStation(editingStation.stationId, editingStation.station);
    } else {
      addStation(editingStation.station);
    }

    setEditingStation(null);
    setEditDialogOpen(false);
  };

  const handleDeleteStation = (stationId: string) => {
    if (window.confirm('Delete this station? It will be removed from all lines.')) {
      deleteStation(stationId);
    }
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
            Station Master
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenEditStation()}
              size="small"
            >
              Add Station
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {stations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <p>No stations defined. Add one to get started.</p>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenEditStation()}
              >
                Add First Station
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(90vh - 200px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell align="right">Longitude</TableCell>
                    <TableCell align="right">Latitude</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id} hover>
                      <TableCell>{station.name}</TableCell>
                      <TableCell>{station.fullName || '-'}</TableCell>
                      <TableCell align="right">
                        {station.longitude != null ? station.longitude.toFixed(6) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {station.latitude != null ? station.latitude.toFixed(6) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditStation(station.id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteStation(station.id)}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Station Sub-Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle>
          {editingStation?.stationId ? 'Edit Station' : 'Create New Station'}
        </DialogTitle>
        <DialogContent>
          {editingStation && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                autoFocus
                fullWidth
                label="Name"
                value={editingStation.station.name}
                onChange={(e) =>
                  setEditingStation({
                    ...editingStation,
                    station: { ...editingStation.station, name: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                label="Full Name"
                value={editingStation.station.fullName || ''}
                onChange={(e) =>
                  setEditingStation({
                    ...editingStation,
                    station: { ...editingStation.station, fullName: e.target.value },
                  })
                }
              />
              <TextField
                fullWidth
                type="number"
                label="Longitude"
                inputProps={{ step: '0.000001' }}
                value={editingStation.station.longitude ?? ''}
                onChange={(e) =>
                  setEditingStation({
                    ...editingStation,
                    station: {
                      ...editingStation.station,
                      longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
              />
              <TextField
                fullWidth
                type="number"
                label="Latitude"
                inputProps={{ step: '0.000001' }}
                value={editingStation.station.latitude ?? ''}
                onChange={(e) =>
                  setEditingStation({
                    ...editingStation,
                    station: {
                      ...editingStation.station,
                      latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveStation}
            variant="contained"
            disabled={!editingStation?.station.name.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
