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
import { useDataStore } from '../../store/dataStore';
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
      if (row.Arrive !== undefined) {
        const adjusted = adjustTime(row.Arrive, timeAdjust.deltaSeconds);
        row.Arrive = adjusted || undefined;
      }
      if (row.Departure !== undefined) {
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
      width: 100,
      getActions: (params) => [
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
