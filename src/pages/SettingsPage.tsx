import { Box, Typography, Card, CardContent, Button, Stack, Alert, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import GavelIcon from '@mui/icons-material/Gavel';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

function SettingsPage() {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const [openClearDialog, setOpenClearDialog] = useState(false);

  const handleExportStorage = () => {
    const allData = localStorage;
    const dataObj: Record<string, unknown> = {};

    for (let i = 0; i < allData.length; i++) {
      const key = allData.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            dataObj[key] = JSON.parse(value);
          } catch {
            dataObj[key] = value;
          }
        }
      }
    }

    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trvis-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportStorage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, JSON.stringify(value));
          }
          alert('Data imported successfully!');
          window.location.reload();
        } catch {
          alert('Failed to import data. Invalid format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearStorage = () => {
    localStorage.clear();
    setOpenClearDialog(false);
    alert('All data has been cleared. Reloading the application...');
    window.location.reload();
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h5">Settings</Typography>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Choose your preferred color theme for the application.
            </Typography>
            <FormControl component="fieldset">
              <FormLabel component="legend">Theme Mode</FormLabel>
              <RadioGroup
                value={mode}
                onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'system')}
              >
                <FormControlLabel value="light" control={<Radio />} label="Light" />
                <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                <FormControlLabel value="system" control={<Radio />} label="System" />
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Full Data Backup
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Export and import all your project data including projects, workgroups, stations,
              lines, and train type patterns. This backs up your entire LocalStorage.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<CloudDownloadIcon />}
                onClick={handleExportStorage}
              >
                Export All Data
              </Button>
              <Button variant="outlined" onClick={handleImportStorage}>
                Import Backup
              </Button>
            </Stack>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Use this to backup and restore all your data, including multiple projects and
                their associated settings.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Clear All Data
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Delete all local data including projects, workgroups, works, trains, and all stored settings. This action cannot be undone.
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setOpenClearDialog(true)}
            >
              Clear All Data
            </Button>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                This will permanently delete all data stored locally. Make sure to export a backup first if you want to preserve your data.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Third Party Licenses
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              View the licenses of all open-source packages used in this application.
            </Typography>
            <Button
              variant="contained"
              startIcon={<GavelIcon />}
              onClick={() => navigate('/licenses')}
            >
              View Licenses
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={openClearDialog}
        onClose={() => setOpenClearDialog(false)}
      >
        <DialogTitle>Clear All Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all your data including projects, workgroups, works, trains, and all settings. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearDialog(false)}>Cancel</Button>
          <Button
            onClick={handleClearStorage}
            color="error"
            variant="contained"
          >
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SettingsPage;
