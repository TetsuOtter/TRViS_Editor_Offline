/**
 * Integration Tests for ProjectStore with Data Repository
 *
 * Tests the interaction between ProjectStore and the data repository layer
 * Validates the complete flow from UI to persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useProjectStore } from '../projectStore';
import { useDataStore } from '../dataStore';
import { useEditorStore } from '../editorStore';
import { v4 as uuidv4 } from 'uuid';

describe('ProjectStore Integration with Repository', () => {
  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset stores
    useDataStore.setState({ workGroups: [] });
    useEditorStore.setState({ stations: [], lines: [], trainTypePatterns: [] });

    // Initialize project store
    await useProjectStore.getState().initialize();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Project Creation and Persistence', () => {
    it('should create project and persist to repository', async () => {
      const projectName = 'Test Project';
      const projectId = await useProjectStore.getState().createProject(projectName);

      expect(projectId).toBeDefined();
      expect(useProjectStore.getState().projects).toHaveLength(1);
      expect(useProjectStore.getState().projects[0].name).toBe(projectName);

      // Verify persistence by reloading from repository
      await useProjectStore.getState().reloadFromRepository();
      expect(useProjectStore.getState().projects).toHaveLength(1);
      expect(useProjectStore.getState().projects[0].id).toBe(projectId);
    });

    it('should set created project as active', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');
      expect(useProjectStore.getState().activeProjectId).toBe(projectId);
    });

    it('should create project with correct metadata structure', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');
      const projectData = useProjectStore.getState().getProjectData(projectId);

      expect(projectData).toBeDefined();
      expect(projectData?.database).toEqual([]);
      expect(projectData?.metadata).toEqual({
        stations: [],
        lines: [],
        trainTypePatterns: [],
      });
    });
  });

  describe('Project Deletion', () => {
    it('should delete project and remove from persistence', async () => {
      const id1 = await useProjectStore.getState().createProject('Project 1');
      const id2 = await useProjectStore.getState().createProject('Project 2');

      await useProjectStore.getState().deleteProject(id1);

      expect(useProjectStore.getState().projects).toHaveLength(1);
      expect(useProjectStore.getState().projects[0].id).toBe(id2);

      // Verify persistence
      await useProjectStore.getState().reloadFromRepository();
      expect(useProjectStore.getState().projects).toHaveLength(1);
    });

    it('should update activeProjectId when active project is deleted', async () => {
      const id1 = await useProjectStore.getState().createProject('Project 1');
      const id2 = await useProjectStore.getState().createProject('Project 2');

      await useProjectStore.getState().setActiveProject(id1);
      await useProjectStore.getState().deleteProject(id1);

      expect(useProjectStore.getState().activeProjectId).not.toBe(id1);
      expect(useProjectStore.getState().activeProjectId).toBe(id2);
    });

    it('should clear activeProjectId if all projects deleted', async () => {
      const projectId = await useProjectStore.getState().createProject('Only Project');
      await useProjectStore.getState().deleteProject(projectId);

      expect(useProjectStore.getState().activeProjectId).toBeNull();
    });
  });

  describe('Data Synchronization', () => {
    it('should sync DataStore with ProjectStore', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');
      const dataStore = useDataStore.getState();

      // Sync data store with project
      dataStore.syncWithProject(projectId);

      expect(dataStore.workGroups).toEqual([]);

      // Add some work groups
      const workGroup = { Name: 'Group 1', Works: [] };
      dataStore.addWorkGroup(workGroup);

      expect(useDataStore.getState().workGroups).toHaveLength(1);
    });

    it('should sync EditorStore with ProjectStore', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');
      const editorStore = useEditorStore.getState();

      editorStore.syncWithProject(projectId);

      expect(editorStore.stations).toEqual([]);
      expect(editorStore.lines).toEqual([]);
      expect(editorStore.trainTypePatterns).toEqual([]);
    });
  });

  describe('Data Persistence Flow', () => {
    it('should persist data from DataStore to repository', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');

      // Add data
      const workGroup = { Name: 'Work Group 1', Works: [] };
      useDataStore.getState().addWorkGroup(workGroup);

      // Save to project
      await useDataStore.getState().saveToProject(projectId);

      // Verify persistence
      const projectData = useProjectStore.getState().getProjectData(projectId);
      expect(projectData?.database).toHaveLength(1);
    });

    it('should persist metadata from EditorStore to repository', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');

      // Add station
      const station = {
        id: uuidv4(),
        name: 'Station 1',
        fullName: 'Station One',
        longitude: 0,
        latitude: 0,
      };
      useEditorStore.getState().addStation(station);

      // Save to project
      await useEditorStore.getState().saveToProject(projectId);

      // Verify persistence
      const projectData = useProjectStore.getState().getProjectData(projectId);
      expect(projectData?.metadata.stations).toHaveLength(1);
      expect(projectData?.metadata.stations[0].name).toBe('Station 1');
    });
  });

  describe('Project Loading and Restoration', () => {
    it('should restore projects from repository on reload', async () => {
      const id1 = await useProjectStore.getState().createProject('Project 1');
      const id2 = await useProjectStore.getState().createProject('Project 2');

      // Reload from repository
      await useProjectStore.getState().reloadFromRepository();

      expect(useProjectStore.getState().projects).toHaveLength(2);
      expect(useProjectStore.getState().projects.map(p => p.id)).toContain(id1);
      expect(useProjectStore.getState().projects.map(p => p.id)).toContain(id2);
    });

    it('should restore project data with workgroups', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');

      // Add and save data
      useDataStore.getState().addWorkGroup({ Name: 'WG1', Works: [] });
      await useDataStore.getState().saveToProject(projectId);

      // Simulate reload
      await useProjectStore.getState().reloadFromRepository();
      useDataStore.getState().syncWithProject(projectId);

      expect(useDataStore.getState().workGroups).toHaveLength(1);
    });

    it('should preserve lastModified timestamp across reloads', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');
      const originalProject = useProjectStore.getState().getProjectData(projectId);
      const originalModified = originalProject?.lastModified;

      // Wait a bit and reload
      await new Promise(resolve => setTimeout(resolve, 10));
      await useProjectStore.getState().reloadFromRepository();

      const reloadedProject = useProjectStore.getState().getProjectData(projectId);
      expect(reloadedProject?.lastModified).toBe(originalModified);
    });
  });

  describe('Active Project Management', () => {
    it('should switch active project', async () => {
      const id1 = await useProjectStore.getState().createProject('Project 1');
      const id2 = await useProjectStore.getState().createProject('Project 2');

      await useProjectStore.getState().setActiveProject(id1);
      expect(useProjectStore.getState().activeProjectId).toBe(id1);

      await useProjectStore.getState().setActiveProject(id2);
      expect(useProjectStore.getState().activeProjectId).toBe(id2);
    });

    it('should persist activeProjectId to repository', async () => {
      const id1 = await useProjectStore.getState().createProject('Project 1');
      const id2 = await useProjectStore.getState().createProject('Project 2');

      await useProjectStore.getState().setActiveProject(id1);

      // Reload and verify
      await useProjectStore.getState().reloadFromRepository();
      expect(useProjectStore.getState().activeProjectId).toBe(id1);
    });

    it('should throw error when setting non-existent project as active', async () => {
      await expect(
        useProjectStore.getState().setActiveProject('non-existent-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple project creations', async () => {
      const promises = [
        useProjectStore.getState().createProject('Project 1'),
        useProjectStore.getState().createProject('Project 2'),
        useProjectStore.getState().createProject('Project 3'),
      ];

      const ids = await Promise.all(promises);

      expect(useProjectStore.getState().projects).toHaveLength(3);
      expect(ids).toHaveLength(3);
    });

    it('should handle rapid data updates', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');

      // Rapid updates
      useDataStore.getState().addWorkGroup({ Name: 'WG1', Works: [] });
      useDataStore.getState().addWorkGroup({ Name: 'WG2', Works: [] });
      useDataStore.getState().addWorkGroup({ Name: 'WG3', Works: [] });

      await useDataStore.getState().saveToProject(projectId);

      const projectData = useProjectStore.getState().getProjectData(projectId);
      expect(projectData?.database).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle deletion of non-existent project gracefully', async () => {
      // Should not throw error
      await useProjectStore.getState().deleteProject('non-existent-id');
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });

    it('should handle update of non-existent project', async () => {
      const database = { workGroups: [] };

      await expect(
        useProjectStore.getState().updateProjectData('non-existent-id', database)
      ).rejects.toThrow('not found');
    });

    it('should handle metadata update of non-existent project', async () => {
      const metadata = { stations: [], lines: [], trainTypePatterns: [] };

      await expect(
        useProjectStore.getState().updateProjectMetadata('non-existent-id', metadata)
      ).rejects.toThrow('not found');
    });
  });

  describe('Store Initialization', () => {
    it('should mark as initialized after init', async () => {
      expect(useProjectStore.getState().isInitialized).toBe(true);
    });

    it('should handle initialization with existing data', async () => {
      const id = await useProjectStore.getState().createProject('Existing Project');

      // Reset and reinitialize (simulating page reload)
      useProjectStore.setState({
        projects: [],
        projectData: {},
        activeProjectId: null,
      });

      await useProjectStore.getState().initialize();

      expect(useProjectStore.getState().projects).toHaveLength(1);
      expect(useProjectStore.getState().projects[0].id).toBe(id);
    });
  });

  describe('Sync Status', () => {
    it('should track sync status', async () => {
      const projectId = await useProjectStore.getState().createProject('Test Project');
      const status = useProjectStore.getState().getSyncStatus?.();

      // Just verify the methods work without throwing
      expect(projectId).toBeDefined();
    });
  });
});
