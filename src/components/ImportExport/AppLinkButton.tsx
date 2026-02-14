import { Button } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useDataStore } from '../../store/dataStore';
import { useProjectStore } from '../../store/projectStore';
import { useMemo } from 'react';

// URL-safe base64 encode function (compatible with TRViS C# implementation)
function urlSafeBase64Encode(input: string): string {
  const base64 = btoa(unescape(encodeURIComponent(input)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function AppLinkButton() {
  const workGroups = useDataStore((state) => state.workGroups);
  const activeProjectData = useProjectStore((state) => {
    if (!state.activeProjectId) return null;
    return state.projectData[state.activeProjectId] || null;
  });

  const appLink = useMemo(() => {
    if (workGroups.length === 0) return '#';
    const jsonData = JSON.stringify(workGroups);
    const encodedData = urlSafeBase64Encode(jsonData);
    return `trvis://app/open/json?data=${encodedData}`;
  }, [workGroups]);

  return (
    <Button
      variant="contained"
      startIcon={<LinkIcon />}
      component="a"
      href={appLink}
      disabled={!activeProjectData || workGroups.length === 0}
      fullWidth
      sx={{ textTransform: 'none' }}
    >
      Open Directly
    </Button>
  );
}
