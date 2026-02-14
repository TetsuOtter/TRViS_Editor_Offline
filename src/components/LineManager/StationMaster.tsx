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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useEditorStore } from '../../store/editorStore';
import type { Station } from '../../types/editor';
import { v4 as uuidv4 } from 'uuid';

interface EditingStation {
  stationId?: string;
  station: Station;
}

export function StationMaster() {
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

  const stationDialog = (
    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
      <DialogTitle>
        {editingStation?.stationId ? 'Edit Station' : 'Create New Station'}
      </DialogTitle>
      <DialogContent>
        {editingStation && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
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
        <Button onClick={handleSaveStation} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (stations.length === 0) {
    return (
      <>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              No stations. Create one to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenEditStation()}
            >
              Create Station
            </Button>
          </CardContent>
        </Card>
        {stationDialog}
      </>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenEditStation()}
        sx={{ mb: 2 }}
      >
        Add Station
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Name</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Longitude</TableCell>
              <TableCell>Latitude</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stations.map((station) => (
              <TableRow key={station.id}>
                <TableCell>{station.name}</TableCell>
                <TableCell>{station.fullName || '—'}</TableCell>
                <TableCell>{station.longitude != null ? station.longitude : '—'}</TableCell>
                <TableCell>{station.latitude != null ? station.latitude : '—'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit Station">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditStation(station.id)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Station">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteStation(station.id)}
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

      {stationDialog}
    </Box>
  );
}
