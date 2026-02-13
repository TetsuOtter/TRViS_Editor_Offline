import { Button, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useDataStore } from '../../store/dataStore';
import { useProjectStore } from '../../store/projectStore';
import { downloadDatabase } from '../../utils/jsonIO';

export function JsonExport() {
  const workGroups = useDataStore((state) => state.workGroups);
  const activeProjectData = useProjectStore((state) => state.getActiveProjectData());

  const handleExport = () => {
    if (!activeProjectData) return;

    const filename = `${activeProjectData.name}-${new Date().toISOString().split('T')[0]}.json`;
    downloadDatabase(workGroups, filename);
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
