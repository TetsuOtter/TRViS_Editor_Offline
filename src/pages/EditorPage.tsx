import { useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Stack } from '@mui/material';
import { useProjectStore } from '../store/projectStore';
import { useDataStore } from '../store/dataStore';
import { useEditorStore } from '../store/editorStore';
import AddIcon from '@mui/icons-material/Add';

function EditorPage() {
  const projects = useProjectStore((state) => state.projects);
  const createProject = useProjectStore((state) => state.createProject);
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
    <Box>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Editor</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => createProject(`Project ${projects.length + 1}`)}
          >
            New Project
          </Button>
        </Box>

        {!activeProjectId ? (
          <Card>
            <CardContent>
              <Typography color="textSecondary">No project selected</Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => createProject('New Project')}
              >
                Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent>
                <Typography variant="h6">Project Info</Typography>
                <Typography>Name: {activeProjectData?.name}</Typography>
                <Typography>Work Groups: {workGroups.length}</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6">WorkGroups</Typography>
                {workGroups.length === 0 ? (
                  <Typography color="textSecondary">No work groups</Typography>
                ) : (
                  <Stack spacing={1}>
                    {workGroups.map((wg, i) => (
                      <Typography key={i}>
                        {i + 1}. {wg.Name} ({wg.Works.length} works)
                      </Typography>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </Box>
  );
}

export default EditorPage;
