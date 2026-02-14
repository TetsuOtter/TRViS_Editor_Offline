import { Box, Typography, Card, CardContent, Button, Stack, Alert } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import GavelIcon from '@mui/icons-material/Gavel';
import { useNavigate } from 'react-router-dom';
import { JsonImport } from '../components/ImportExport/JsonImport';
import { AppLinkButton } from '../components/ImportExport/AppLinkButton';

function SettingsPage() {
  const navigate = useNavigate();

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

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h5">Settings</Typography>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import JSON Timetable
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Import a TRViS-formatted JSON file to load timetable data into the active project.
            </Typography>
            <JsonImport />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AppLink for TRViS App
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Generate an AppLink that can be shared with the TRViS app to load your timetable
              data directly.
            </Typography>
            <AppLinkButton />
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
    </Box>
  );
}

export default SettingsPage;
