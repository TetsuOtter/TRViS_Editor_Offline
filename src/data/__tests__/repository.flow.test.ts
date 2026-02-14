/**
 * Data Flow Integration Tests
 *
 * Tests the complete flow from UI layer through stores to repository
 * Validates that data modifications are properly persisted end-to-end
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useProjectStore } from '../../store/projectStore';
import { useDataStore } from '../../store/dataStore';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuidv4 } from 'uuid';

describe('Data Flow: UI → Store → Repository', () => {
  beforeEach(async () => {
    localStorage.clear();
    await useProjectStore.getState().initialize();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Scenario: User creates a project, adds timetable data, and adds station info
   * Expected: All data is persisted correctly across all layers
   */
  describe('Complete Data Lifecycle', () => {
    it('should persist project creation through all layers', async () => {
      const projectName = 'My Railway Line';

      // Layer 1: UI creates project
      const projectId = await useProjectStore.getState().createProject(projectName);

      // Verify in ProjectStore
      expect(useProjectStore.getState().activeProjectId).toBe(projectId);

      // Verify in repository (localStorage)
      const stored = localStorage.getItem('trvis-projects');
      expect(stored).toBeTruthy();
      const parsedData = JSON.parse(stored!);
      expect(parsedData.projectData).toContainEqual(
        expect.objectContaining({ projectId, name: projectName })
      );
    });

    it('should sync timetable data through DataStore to repository', async () => {
      // Create project
      const projectId = await useProjectStore.getState().createProject('Railway Project');

      // Sync DataStore with project
      useDataStore.getState().syncWithProject(projectId);

      // User adds a work group (represents a timetable schedule)
      const workGroup = {
        Name: 'Monday Schedule',
        Works: [
          {
            Name: 'Service A',
            AffectDate: '2024-01-15',
            Trains: [
              {
                Id: uuidv4(),
                TrainNumber: 'LX001',
                Direction: 1,
                MaxSpeed: 100,
                CarCount: 6,
                TimetableRows: [
                  {
                    StationName: 'Station A',
                    Location_m: 0,
                    ArrivalTime: null,
                    DepartureTime: '06:00:00',
                    TrackName: '1',
                  },
                  {
                    StationName: 'Station B',
                    Location_m: 5000,
                    ArrivalTime: '06:05:00',
                    DepartureTime: '06:06:00',
                    TrackName: '1',
                  },
                ],
              },
            ],
          },
        ],
      };

      useDataStore.getState().addWorkGroup(workGroup);

      // Save to project
      await useDataStore.getState().saveToProject(projectId);

      // Verify in repository
      const projectData = useProjectStore.getState().getProjectData(projectId);
      expect(projectData?.database).toHaveLength(1);
      expect(projectData?.database[0].Name).toBe('Monday Schedule');
      expect(projectData?.database[0].Works[0].Trains[0].TrainNumber).toBe('LX001');

      // Verify in localStorage
      const stored = JSON.parse(localStorage.getItem('trvis-projects')!);
      const storedProject = stored.projectData.find((p: any) => p.projectId === projectId);
      expect(storedProject.database).toHaveLength(1);
    });

    it('should sync station metadata through EditorStore to repository', async () => {
      // Create project
      const projectId = await useProjectStore.getState().createProject('Railway Project');

      // Sync EditorStore with project
      useEditorStore.getState().syncWithProject(projectId);

      // User adds station metadata
      const stations = [
        {
          id: uuidv4(),
          name: 'Shibuya',
          fullName: 'Shibuya Station',
          longitude: 139.7016,
          latitude: 35.6595,
        },
        {
          id: uuidv4(),
          name: 'Shinjuku',
          fullName: 'Shinjuku Station',
          longitude: 139.7008,
          latitude: 35.6897,
        },
      ];

      stations.forEach(station => useEditorStore.getState().addStation(station));

      // User adds line information
      const lineId = uuidv4();
      useEditorStore.getState().addLine({
        id: lineId,
        name: 'Yamanote Line',
        stations: stations.map(s => ({ stationId: s.id, distanceFromStart_m: 0 })),
      });

      // Save metadata to project
      await useEditorStore.getState().saveToProject(projectId);

      // Verify in repository
      const projectData = useProjectStore.getState().getProjectData(projectId);
      expect(projectData?.metadata.stations).toHaveLength(2);
      expect(projectData?.metadata.lines).toHaveLength(1);
      expect(projectData?.metadata.lines[0].name).toBe('Yamanote Line');

      // Verify in localStorage
      const stored = JSON.parse(localStorage.getItem('trvis-projects')!);
      const storedProject = stored.projectData.find((p: any) => p.id === projectId);
      expect(storedProject.metadata.stations).toHaveLength(2);
      expect(storedProject.metadata.lines).toHaveLength(1);
    });
  });

  /**
   * Scenario: User switches between projects
   * Expected: Correct data is loaded for each project independently
   */
  describe('Multi-Project Context Switching', () => {
    it('should isolate data between different projects', async () => {
      // Create two projects
      const projectId1 = await useProjectStore.getState().createProject('Tokyo Lines');
      const projectId2 = await useProjectStore.getState().createProject('Osaka Lines');

      // Work on project 1
      useDataStore.getState().syncWithProject(projectId1);
      useDataStore.getState().addWorkGroup({
        Name: 'Tokyo Schedule',
        Works: [],
      });
      await useDataStore.getState().saveToProject(projectId1);

      // Switch to project 2
      await useProjectStore.getState().setActiveProject(projectId2);
      useDataStore.getState().syncWithProject(projectId2);

      // Project 2 should have no work groups
      expect(useDataStore.getState().workGroups).toHaveLength(0);

      // Switch back to project 1
      await useProjectStore.getState().setActiveProject(projectId1);
      useDataStore.getState().syncWithProject(projectId1);

      // Project 1 should have the data we added
      expect(useDataStore.getState().workGroups).toHaveLength(1);
      expect(useDataStore.getState().workGroups[0].Name).toBe('Tokyo Schedule');
    });
  });

  /**
   * Scenario: User reloads the page
   * Expected: All previous data is restored from repository
   */
  describe('Data Restoration After Page Reload', () => {
    it('should restore complete project state after reload', async () => {
      // Create and populate project
      const projectId = await useProjectStore.getState().createProject('Test Project');

      // Add timetable data
      useDataStore.getState().syncWithProject(projectId);
      useDataStore.getState().addWorkGroup({
        Name: 'Schedule 1',
        Works: [],
      });
      await useDataStore.getState().saveToProject(projectId);

      // Add station metadata
      useEditorStore.getState().syncWithProject(projectId);
      useEditorStore.getState().addStation({
        id: uuidv4(),
        name: 'Station 1',
        fullName: 'Station One',
        longitude: 0,
        latitude: 0,
      });
      await useEditorStore.getState().saveToProject(projectId);

      // Simulate page reload by clearing store state
      useProjectStore.setState({
        projects: [],
        projectData: {},
        activeProjectId: null,
      });
      useDataStore.setState({ workGroups: [] });
      useEditorStore.setState({
        stations: [],
        lines: [],
        trainTypePatterns: [],
      });

      // Reinitialize (like on app startup)
      await useProjectStore.getState().initialize();

      // Verify project was restored
      expect(useProjectStore.getState().projects).toHaveLength(1);
      expect(useProjectStore.getState().projects[0].id).toBe(projectId);

      // Verify and restore data
      useDataStore.getState().syncWithProject(projectId);
      expect(useDataStore.getState().workGroups).toHaveLength(1);

      useEditorStore.getState().syncWithProject(projectId);
      expect(useEditorStore.getState().stations).toHaveLength(1);
    });
  });

  /**
   * Scenario: User exports and imports a project
   * Expected: Data maintains integrity through serialization/deserialization
   */
  describe('Data Integrity Through Export/Import', () => {
    it('should maintain data structure through serialization', async () => {
      // Create project with complex data
      const projectId = await useProjectStore.getState().createProject('Export Test');

      useDataStore.getState().syncWithProject(projectId);
      const complexWorkGroup = {
        Name: 'Complex Schedule',
        Works: [
          {
            Name: 'Work 1',
            AffectDate: '2024-01-15',
            Trains: [
              {
                Id: uuidv4(),
                TrainNumber: 'TEST001',
                Direction: 1,
                MaxSpeed: 120,
                CarCount: 8,
                TimetableRows: [
                  {
                    StationName: 'St A',
                    Location_m: 0,
                    ArrivalTime: null,
                    DepartureTime: '06:00:00',
                  },
                ],
              },
            ],
          },
        ],
      };

      useDataStore.getState().addWorkGroup(complexWorkGroup);
      await useDataStore.getState().saveToProject(projectId);

      // Export data
      const projectData = useProjectStore.getState().getProjectData(projectId);
      const exported = JSON.stringify(projectData);

      // Clear and reimport
      useProjectStore.setState({
        projects: [],
        projectData: {},
        activeProjectId: null,
      });

      const imported = JSON.parse(exported);
      await useProjectStore.getState().createProject(imported.name);

      // Verify structure is intact
      const reimported = useProjectStore.getState().getProjectData(
        useProjectStore.getState().projects[0].id
      );
      expect(reimported?.database).toHaveLength(1);
      expect(reimported?.database[0].Works[0].Trains[0].TrainNumber).toBe('TEST001');
    });
  });

  /**
   * Scenario: Multiple rapid edits are made
   * Expected: All edits are captured and persisted correctly
   */
  describe('High-Frequency Updates', () => {
    it('should handle rapid sequential updates', async () => {
      const projectId = await useProjectStore.getState().createProject('Rapid Update Test');
      useDataStore.getState().syncWithProject(projectId);

      // Rapid updates
      for (let i = 0; i < 5; i++) {
        useDataStore.getState().addWorkGroup({
          Name: `Schedule ${i}`,
          Works: [],
        });
      }

      // Save
      await useDataStore.getState().saveToProject(projectId);

      // Verify all updates were persisted
      const projectData = useProjectStore.getState().getProjectData(projectId);
      expect(projectData?.database).toHaveLength(5);

      // Verify in localStorage
      const stored = JSON.parse(localStorage.getItem('trvis-projects')!);
      const storedProject = stored.projectData.find((p: any) => p.projectId === projectId);
      expect(storedProject.database).toHaveLength(5);
    });
  });

  /**
   * Scenario: Repository backend switch (from localStorage to HTTP)
   * Expected: Data compatibility is maintained, operations work the same way
   */
  describe('Repository Abstraction Compatibility', () => {
    it('should use same API regardless of repository type', async () => {
      // The public API of ProjectStore should be identical
      // whether using localStorage or HTTP backend

      const projectStore = useProjectStore.getState();

      // These methods should work with any repository implementation
      expect(typeof projectStore.createProject).toBe('function');
      expect(typeof projectStore.deleteProject).toBe('function');
      expect(typeof projectStore.setActiveProject).toBe('function');
      expect(typeof projectStore.updateProjectData).toBe('function');
      expect(typeof projectStore.getProject).toBe('function');
      expect(typeof projectStore.getProjectData).toBe('function');
      expect(typeof projectStore.syncToRepository).toBe('function');
      expect(typeof projectStore.reloadFromRepository).toBe('function');

      // API is agnostic to underlying repository
      const projectId = await projectStore.createProject('API Test');
      expect(projectId).toBeDefined();

      // Can switch repositories without changing API
      await projectStore.syncToRepository();
      // ^^ This would work the same with HTTP adapter
    });
  });
});
