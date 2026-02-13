import { Button, Stack, Alert, Typography, Box } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { useProjectStore } from '../../store/projectStore';
import { useRef, useState } from 'react';
import { isValidDatabase } from '../../utils/jsonIO';

export function JsonImport() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const updateProjectData = useProjectStore((state) => state.updateProjectData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProjectId) return;

    try {
      setError(null);
      setSuccess(null);

      const text = await file.text();
      const data = JSON.parse(text);

      if (!isValidDatabase(data)) {
        setError('Invalid TRViS JSON format. Please check your file.');
        return;
      }

      // Update the active project with the imported data
      updateProjectData(activeProjectId, data);
      setSuccess(`Successfully imported ${file.name}. Loaded ${data.length} work groups.`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    }
  };

  return (
    <Stack spacing={2}>
      <Box>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button
          variant="contained"
          startIcon={<FileUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={!activeProjectId}
          fullWidth
        >
          Import JSON File
        </Button>
      </Box>

      {error && (
        <Alert severity="error">
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {success && (
        <Alert severity="success">
          <Typography variant="body2">{success}</Typography>
        </Alert>
      )}

      <Typography variant="caption" color="textSecondary">
        Select a TRViS-formatted JSON file to import. This will replace the current work group data in the active
        project.
      </Typography>
    </Stack>
  );
}
