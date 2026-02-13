import { Box, Typography, Card, CardContent, Button, Stack } from '@mui/material';

function SettingsPage() {
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
              LocalStorage Management
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Export and import all your project data including projects, workgroups, stations,
              lines, and train type patterns.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleExportStorage}>
                Export All Data
              </Button>
              <Button variant="outlined" onClick={handleImportStorage}>
                Import Data
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              AppLink (TBD)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              AppLink functionality will be implemented here. You can use AppLink to send your
              timetable data to the TRViS app.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

export default SettingsPage;
