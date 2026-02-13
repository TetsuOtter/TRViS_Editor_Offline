import { useEffect } from 'react';
import { Box, Typography, Card, CardContent, Stack, Grid } from '@mui/material';
import { useProjectStore } from '../store/projectStore';
import { useDataStore } from '../store/dataStore';
import { useEditorStore } from '../store/editorStore';
import { ProjectSelector } from '../components/ProjectPanel/ProjectSelector';
import { JsonExport } from '../components/ImportExport/JsonExport';

function EditorPage() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeProjectData = useProjectStore((state) => state.getActiveProjectData());

  const workGroups = useDataStore((state) => state.workGroups);
  const syncWithProject = useDataStore((state) => state.syncWithProject);
  const syncEditorWithProject = useEditorStore((state) => state.syncWithProject);

  // Sync data when project changes
  useEffect(() => {
    if (activeProjectId) {
      syncWithProject(activeProjectId);
      syncEditorWithProject(activeProjectId);
    }
  }, [activeProjectId, syncWithProject, syncEditorWithProject]);

  return (
    <Grid container spacing={3}>
      {/* Left panel: Project selector */}
      <Grid size={{ xs: 12, sm: 4 }}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Projects
          </Typography>
          <ProjectSelector />
        </Box>
      </Grid>

      {/* Right panel: Editor content */}
      <Grid size={{ xs: 12, sm: 8 }}>
        {!activeProjectId ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">Select or create a project to begin</Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {activeProjectData?.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Work Groups: {workGroups.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Last modified: {new Date(activeProjectData?.lastModified || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export
                </Typography>
                <JsonExport />
              </CardContent>
            </Card>

            {workGroups.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    WorkGroups ({workGroups.length})
                  </Typography>
                  <Stack spacing={1}>
                    {workGroups.map((wg, i) => (
                      <Typography key={i} variant="body2">
                        {i + 1}. <strong>{wg.Name}</strong> ({wg.Works.length} works)
                      </Typography>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </Grid>
    </Grid>
  );
}

export default EditorPage;
