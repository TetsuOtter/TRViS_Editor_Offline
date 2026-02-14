import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Stack, Grid, Tabs, Tab } from '@mui/material';
import { useProjectStore } from '../store/projectStore';
import { useDataStore } from '../store/dataStore';
import { useEditorStore } from '../store/editorStore';
import { ProjectSelector } from '../components/ProjectPanel/ProjectSelector';
import { JsonExport } from '../components/ImportExport/JsonExport';
import { StationMaster } from '../components/LineManager/StationMaster';
import { LineEditor } from '../components/LineManager/LineEditor';
import { TrainTypePatternEditor } from '../components/LineManager/TrainTypePatternEditor';
import { WorkGroupEditor } from '../components/WorkGroupEditor/WorkGroupEditor';

function EditorPage() {
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeProjectData = useProjectStore((state) => {
    if (!state.activeProjectId) return null;
    return state.projectData[state.activeProjectId] || null;
  });

  const workGroups = useDataStore((state) => state.workGroups);
  const syncWithProject = useDataStore((state) => state.syncWithProject);
  const syncEditorWithProject = useEditorStore((state) => state.syncWithProject);

  const [activeTab, setActiveTab] = useState<number>(0);

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
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  aria-label="editor tabs"
                >
                  <Tab label="Work Groups" />
                  <Tab label="Stations" />
                  <Tab label="Lines" />
                  <Tab label="Train Types" />
                </Tabs>
              </Box>

              <CardContent>
                {activeTab === 0 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Work Groups
                      </Typography>
                      <WorkGroupEditor />
                    </Box>

                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Export
                      </Typography>
                      <JsonExport />
                    </Box>
                  </Stack>
                )}

                {activeTab === 1 && <StationMaster />}

                {activeTab === 2 && <LineEditor />}

                {activeTab === 3 && <TrainTypePatternEditor />}
              </CardContent>
            </Card>
          </Stack>
        )}
      </Grid>
    </Grid>
  );
}

export default EditorPage;
