import { Button, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useDataStore } from '../../store/dataStore';
import { useProjectStore } from '../../store/projectStore';
import { downloadDatabaseWithSettings } from '../../utils/jsonIO';

export function JsonExport() {
  const workGroups = useDataStore((state) => state.workGroups);
  const activeProjectData = useProjectStore((state) => {
    if (!state.activeProjectId) return null;
    return state.projectData[state.activeProjectId] || null;
  });

  const handleExport = () => {
    if (!activeProjectData) return;

    const filename = `${activeProjectData.name}-${new Date().toISOString().split('T')[0]}.json`;
    downloadDatabaseWithSettings(workGroups, filename);
  };

  return (
    <Stack spacing={1}>
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={handleExport}
        disabled={!activeProjectData || workGroups.length === 0}
        fullWidth
      >
        Download as JSON
      </Button>
    </Stack>
  );
}
