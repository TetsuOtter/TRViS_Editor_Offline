import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid } from '@mui/material';
import { useProjectStore } from '../store/projectStore';
import { useDataStore } from '../store/dataStore';
import { useEditorStore } from '../store/editorStore';
import { ProjectSelector } from '../components/ProjectPanel/ProjectSelector';

function EditorPage() {
  const navigate = useNavigate();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  const syncWithProject = useDataStore((state) => state.syncWithProject);
  const syncEditorWithProject = useEditorStore((state) => state.syncWithProject);

  // Sync data when project is selected from the selector
  useEffect(() => {
    if (activeProjectId) {
      syncWithProject(activeProjectId);
      syncEditorWithProject(activeProjectId);
      // Redirect to WorkGroups page
      navigate(`/project/${activeProjectId}/workgroups`);
    }
  }, [activeProjectId, syncWithProject, syncEditorWithProject, navigate]);

  return (
    <Grid container spacing={3} justifyContent="center">
      <Grid size={{ xs: 12, sm: 8, md: 6 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
            Projects
          </Typography>
          <ProjectSelector />
        </Box>
      </Grid>
    </Grid>
  );
}

export default EditorPage;
