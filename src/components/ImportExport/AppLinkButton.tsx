import { Button, Stack, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useDataStore } from '../../store/dataStore';
import { useProjectStore } from '../../store/projectStore';
import { useState } from 'react';

export function AppLinkButton() {
  const workGroups = useDataStore((state) => state.workGroups);
  const activeProjectData = useProjectStore((state) => {
    if (!state.activeProjectId) return null;
    return state.projectData[state.activeProjectId] || null;
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [appLink, setAppLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateAppLink = () => {
    if (workGroups.length === 0) return;

    // Convert workGroups to JSON
    const jsonData = JSON.stringify(workGroups);
    // URL encode the JSON
    const encodedData = encodeURIComponent(jsonData);
    // Create the AppLink URL
    const link = `trvis://app/open/json?data=${encodedData}`;
    setAppLink(link);
    setDialogOpen(true);
    setCopied(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<LinkIcon />}
        onClick={handleGenerateAppLink}
        disabled={!activeProjectData || workGroups.length === 0}
        fullWidth
      >
        Generate AppLink
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>AppLink for TRViS App</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                This link can be shared with the TRViS app to load your timetable data.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={appLink}
                variant="outlined"
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Box>

            <Typography variant="body2" color="textSecondary">
              The link contains your complete timetable data (WorkGroups, Works, Trains, and Timetables) encoded as
              JSON. Open this link with the TRViS app to load the data.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleCopyLink}
            variant="contained"
            startIcon={<ContentCopyIcon />}
            color={copied ? 'success' : 'primary'}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
