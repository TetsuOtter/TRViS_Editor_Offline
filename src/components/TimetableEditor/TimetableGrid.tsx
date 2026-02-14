import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowModesModel,
  GridEventListener,
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import EditIcon from '@mui/icons-material/Edit';
import { useDataStore } from '../../store/dataStore';
import { createDefaultTRViSConfiguration } from '../../types/trvisconfiguration';
import { FormField } from '../FormFields/TRViSFormFields';
import type { TimetableRow } from '../../types/trvis';
import { adjustTime } from '../../utils/timeUtils';
import { v4 as uuidv4 } from 'uuid';

interface TimetableGridProps {
  workGroupIndex: number;
  workIndex: number;
  trainIndex: number;
}

interface TimeAdjustment {
  open: boolean;
  startRowIndex: number | null;
  deltaSeconds: number;
}

interface EditingRow {
  rowIndex: number;
  row: TimetableRow;
}

export function TimetableGrid({
  workGroupIndex,
  workIndex,
  trainIndex,
}: TimetableGridProps) {
  const getTrain = useDataStore((state) => state.getTrain);
  const updateTimetableRow = useDataStore((state) => state.updateTimetableRow);
  const addTimetableRow = useDataStore((state) => state.addTimetableRow);
  const deleteTimetableRow = useDataStore((state) => state.deleteTimetableRow);

  const train = getTrain(workGroupIndex, workIndex, trainIndex);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [timeAdjust, setTimeAdjust] = useState<TimeAdjustment>({
    open: false,
    startRowIndex: null,
    deltaSeconds: 0,
  });
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [editRowDialogOpen, setEditRowDialogOpen] = useState(false);
  const [editTabIndex, setEditTabIndex] = useState(0);

  const rowConfig = createDefaultTRViSConfiguration().timetableRow;

  if (!train) {
    return <Box>Train not found</Box>;
  }

  const rows = train.TimetableRows.map((row, idx) => ({
    id: idx,
    ...row,
  }));

  const handleAddRow = () => {
    const newRow: TimetableRow = {
      Id: uuidv4(),
      StationName: 'New Station',
      Location_m: 0,
    };
    addTimetableRow(workGroupIndex, workIndex, trainIndex, newRow);
  };

  const handleDeleteRow = (id: number) => {
    deleteTimetableRow(workGroupIndex, workIndex, trainIndex, id);
  };

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = (newRow: (typeof rows)[0]) => {
    const updatedRow = { ...newRow };
    delete (updatedRow as Record<string, unknown>).id;
    updateTimetableRow(
      workGroupIndex,
      workIndex,
      trainIndex,
      newRow.id as number,
      updatedRow as TimetableRow
    );
    return newRow;
  };

  const handleApplyTimeAdjustment = () => {
    if (timeAdjust.startRowIndex === null) return;

    const startRow = train.TimetableRows[timeAdjust.startRowIndex];
    if (!startRow?.Arrive && !startRow?.Departure) return;

    for (let i = timeAdjust.startRowIndex + 1; i < train.TimetableRows.length; i++) {
      const row = { ...train.TimetableRows[i] };
      if (row.Arrive != null) {
        const adjusted = adjustTime(row.Arrive, timeAdjust.deltaSeconds);
        row.Arrive = adjusted || undefined;
      }
      if (row.Departure != null) {
        const adjusted = adjustTime(row.Departure, timeAdjust.deltaSeconds);
        row.Departure = adjusted || undefined;
      }
      updateTimetableRow(workGroupIndex, workIndex, trainIndex, i, row);
    }

    setTimeAdjust({ open: false, startRowIndex: null, deltaSeconds: 0 });
  };

  const columns: GridColDef[] = [
    {
      field: 'StationName',
      headerName: 'Station',
      width: 120,
      editable: true,
    },
    {
      field: 'FullName',
      headerName: 'Full Name',
      width: 150,
      editable: true,
    },
    {
      field: 'Location_m',
      headerName: 'Location (m)',
      width: 100,
      type: 'number',
      editable: true,
    },
    {
      field: 'Arrive',
      headerName: 'Arrive',
      width: 100,
      editable: true,
      renderCell: (params) => params.value || '—',
    },
    {
      field: 'Departure',
      headerName: 'Departure',
      width: 100,
      editable: true,
      renderCell: (params) => params.value || '—',
    },
    {
      field: 'TrackName',
      headerName: 'Track',
      width: 80,
      editable: true,
    },
    {
      field: 'IsPass',
      headerName: 'Pass',
      width: 60,
      type: 'boolean',
      editable: true,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Edit details">
              <EditIcon />
            </Tooltip>
          }
          label="Edit"
          onClick={() => {
            const rowIndex = params.id as number;
            const row = train.TimetableRows[rowIndex];
            if (row) {
              setEditingRow({ rowIndex, row: { ...row } });
              setEditRowDialogOpen(true);
            }
          }}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Adjust from here">
              <TimelineIcon />
            </Tooltip>
          }
          label="Adjust"
          onClick={() => {
            setTimeAdjust({
              open: true,
              startRowIndex: params.id as number,
              deltaSeconds: 0,
            });
          }}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete">
              <DeleteIcon />
            </Tooltip>
          }
          label="Delete"
          onClick={() => handleDeleteRow(params.id as number)}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddRow}
        sx={{ mb: 2 }}
      >
        Add Row
      </Button>

      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
        />
      </Box>

      {/* Edit Row Dialog */}
      <Dialog
        open={editRowDialogOpen}
        onClose={() => setEditRowDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Timetable Row</DialogTitle>
        <DialogContent>
          {editingRow && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={editTabIndex} onChange={(_, value) => setEditTabIndex(value)}>
                <Tab label="Basic" />
                <Tab label="Timing" />
                <Tab label="Advanced" />
              </Tabs>

              <Box sx={{ mt: 2 }}>
                {editTabIndex === 0 && (
                  <Stack spacing={2}>
                    <FormField
                      label="Station Name"
                      value={editingRow.row.StationName}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, StationName: value },
                        })
                      }
                      config={rowConfig.stationName || { enabled: true, required: true, description: '' }}
                    />
                    <FormField
                      label="Full Name"
                      value={editingRow.row.FullName || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, FullName: value },
                        })
                      }
                      config={rowConfig.fullName || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Location (m)"
                      value={editingRow.row.Location_m}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, Location_m: value },
                        })
                      }
                      type="number"
                      config={rowConfig.location_m || { enabled: true, required: true, description: '', unit: 'm' }}
                    />
                    <FormField
                      label="Track Name"
                      value={editingRow.row.TrackName || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, TrackName: value },
                        })
                      }
                      config={rowConfig.trackName || { enabled: true, required: false, description: '' }}
                    />
                  </Stack>
                )}

                {editTabIndex === 1 && (
                  <Stack spacing={2}>
                    <FormField
                      label="Arrive Time"
                      value={editingRow.row.Arrive || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, Arrive: value },
                        })
                      }
                      type="time"
                      config={rowConfig.arrive || { enabled: true, required: false, description: '', format: 'HH:MM:SS' }}
                    />
                    <FormField
                      label="Departure Time"
                      value={editingRow.row.Departure || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, Departure: value },
                        })
                      }
                      type="time"
                      config={rowConfig.departure || { enabled: true, required: false, description: '', format: 'HH:MM:SS' }}
                    />
                    <FormField
                      label="Drive Time MM"
                      value={editingRow.row.DriveTime_MM || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, DriveTime_MM: value },
                        })
                      }
                      type="number"
                      config={rowConfig.driveTime_MM || { enabled: true, required: false, description: '', min: 0, max: 99 }}
                    />
                    <FormField
                      label="Drive Time SS"
                      value={editingRow.row.DriveTime_SS || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, DriveTime_SS: value },
                        })
                      }
                      type="number"
                      config={rowConfig.driveTime_SS || { enabled: true, required: false, description: '', min: 0, max: 59 }}
                    />
                  </Stack>
                )}

                {editTabIndex === 2 && (
                  <Stack spacing={2}>
                    <FormField
                      label="Longitude"
                      value={editingRow.row.Longitude_deg || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, Longitude_deg: value },
                        })
                      }
                      type="number"
                      config={rowConfig.longitude_deg || { enabled: true, required: false, description: '', min: -180, max: 180 }}
                    />
                    <FormField
                      label="Latitude"
                      value={editingRow.row.Latitude_deg || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, Latitude_deg: value },
                        })
                      }
                      type="number"
                      config={rowConfig.latitude_deg || { enabled: true, required: false, description: '', min: -90, max: 90 }}
                    />
                    <FormField
                      label="On Station Detect Radius (m)"
                      value={editingRow.row.OnStationDetectRadius_m || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, OnStationDetectRadius_m: value },
                        })
                      }
                      type="number"
                      config={rowConfig.onStationDetectRadius_m || { enabled: true, required: false, description: '', unit: 'm' }}
                    />
                    <FormField
                      label="Is Pass"
                      value={editingRow.row.IsPass || false}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, IsPass: value },
                        })
                      }
                      type="boolean"
                      config={rowConfig.isPass || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Is Last Stop"
                      value={editingRow.row.IsLastStop || false}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, IsLastStop: value },
                        })
                      }
                      type="boolean"
                      config={rowConfig.isLastStop || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Is Operation Only Stop"
                      value={editingRow.row.IsOperationOnlyStop || false}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, IsOperationOnlyStop: value },
                        })
                      }
                      type="boolean"
                      config={rowConfig.isOperationOnlyStop || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Has Bracket"
                      value={editingRow.row.HasBracket || false}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, HasBracket: value },
                        })
                      }
                      type="boolean"
                      config={rowConfig.hasBracket || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Run In Limit"
                      value={editingRow.row.RunInLimit || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, RunInLimit: value },
                        })
                      }
                      type="number"
                      config={rowConfig.runInLimit || { enabled: true, required: false, description: '', min: 0, max: 999 }}
                    />
                    <FormField
                      label="Run Out Limit"
                      value={editingRow.row.RunOutLimit || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, RunOutLimit: value },
                        })
                      }
                      type="number"
                      config={rowConfig.runOutLimit || { enabled: true, required: false, description: '', min: 0, max: 999 }}
                    />
                    <FormField
                      label="Marker Color"
                      value={editingRow.row.MarkerColor || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, MarkerColor: value },
                        })
                      }
                      type="color"
                      config={rowConfig.markerColor || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Marker Text"
                      value={editingRow.row.MarkerText || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, MarkerText: value },
                        })
                      }
                      config={rowConfig.markerText || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Record Type"
                      value={editingRow.row.RecordType || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, RecordType: value },
                        })
                      }
                      type="number"
                      config={rowConfig.recordType || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Work Type"
                      value={editingRow.row.WorkType || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, WorkType: value },
                        })
                      }
                      type="number"
                      config={rowConfig.workType || { enabled: true, required: false, description: '' }}
                    />
                    <FormField
                      label="Remarks"
                      value={editingRow.row.Remarks || ''}
                      onChange={(value) =>
                        setEditingRow({
                          ...editingRow,
                          row: { ...editingRow.row, Remarks: value },
                        })
                      }
                      type="textarea"
                      config={rowConfig.remarks || { enabled: true, required: false, description: '' }}
                    />
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRowDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (editingRow) {
                updateTimetableRow(
                  workGroupIndex,
                  workIndex,
                  trainIndex,
                  editingRow.rowIndex,
                  editingRow.row
                );
                setEditRowDialogOpen(false);
                setEditingRow(null);
              }
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Adjustment Dialog */}
      <Dialog
        open={timeAdjust.open}
        onClose={() => setTimeAdjust({ ...timeAdjust, open: false })}
        fullWidth
      >
        <DialogTitle>Adjust Times from Row {(timeAdjust.startRowIndex ?? 0) + 1}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Time Adjustment (MM:SS)"
              placeholder="+05:30"
              onChange={(e) => {
                const match = e.target.value.match(/^([+-])?(\d{1,2}):(\d{2})$/);
                if (match) {
                  const sign = match[1] === '-' ? -1 : 1;
                  const minutes = parseInt(match[2], 10);
                  const seconds = parseInt(match[3], 10);
                  const totalSeconds = sign * (minutes * 60 + seconds);
                  setTimeAdjust({ ...timeAdjust, deltaSeconds: totalSeconds });
                }
              }}
            />
            <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Format: [+/-]MM:SS (e.g., +05:30 or -02:15)
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeAdjust({ ...timeAdjust, open: false })}>Cancel</Button>
          <Button onClick={handleApplyTimeAdjustment} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
