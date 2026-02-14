/**
 * Unit Tests for LocalStorageAdapter
 *
 * Tests all CRUD operations, error handling, and sync functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { ProjectData, StorageState } from '../../types/storage';
import { v4 as uuidv4 } from 'uuid';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  const storageKey = 'test-trvis-projects';

  const createMockProject = (overrides?: Partial<ProjectData>): ProjectData => ({
    projectId: uuidv4(),
    name: 'Test Project',
    createdAt: Date.now(),
    lastModified: Date.now(),
    database: [],
    metadata: {
      stations: [],
      lines: [],
      trainTypePatterns: [],
    },
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter({ storageKey });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully when localStorage is available', async () => {
      const result = await adapter.initialize();
      expect(result.success).toBe(true);
      expect(adapter.isReady()).toBe(true);
    });

    it('should handle localStorage unavailability', async () => {
      // Mock localStorage to be unavailable
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const adapter2 = new LocalStorageAdapter({ storageKey });
      const result = await adapter2.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toContain('localStorage is not available');

      getItemSpy.mockRestore();
    });

    it('should detect corrupted localStorage data', async () => {
      localStorage.setItem(storageKey, 'invalid json{');
      const result = await adapter.initialize();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Corrupted');
    });
  });

  describe('Project CRUD Operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('createProject', () => {
      it('should create a new project', async () => {
        const project = createMockProject();
        const result = await adapter.createProject(project);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(project);
      });

      it('should persist project to localStorage', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const state = await adapter.loadStorageState();
        expect(state.success).toBe(true);
        expect(state.data.projectData).toContainEqual(project);
      });

      it('should reject duplicate projects', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const result = await adapter.createProject(project);
        expect(result.success).toBe(false);
        expect(result.error).toContain('already exists');
      });

      it('should increment pending changes count', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const status = adapter.getSyncStatus();
        expect(status.pendingChanges).toBeGreaterThan(0);
      });
    });

    describe('getProject', () => {
      it('should retrieve an existing project', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const result = await adapter.getProject(project.projectId);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(project);
      });

      it('should return error for non-existent project', async () => {
        const result = await adapter.getProject('non-existent-id');
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });
    });

    describe('getProjects', () => {
      it('should return all projects', async () => {
        const project1 = createMockProject();
        const project2 = createMockProject();

        await adapter.createProject(project1);
        await adapter.createProject(project2);

        const result = await adapter.getProjects();
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data).toContainEqual(project1);
        expect(result.data).toContainEqual(project2);
      });

      it('should return empty array when no projects exist', async () => {
        const result = await adapter.getProjects();
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe('updateProject', () => {
      it('should update an existing project', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const updated = { ...project, name: 'Updated Name' };
        const result = await adapter.updateProject(project.projectId, updated);

        expect(result.success).toBe(true);
        expect(result.data.name).toBe('Updated Name');
      });

      it('should persist updates to localStorage', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const updated = { ...project, name: 'Updated Name', lastModified: Date.now() };
        await adapter.updateProject(project.projectId, updated);

        const retrieved = await adapter.getProject(project.projectId);
        expect(retrieved.data.name).toBe('Updated Name');
      });

      it('should return error for non-existent project', async () => {
        const project = createMockProject();
        const result = await adapter.updateProject('non-existent-id', project);

        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });
    });

    describe('updateProjectPartial', () => {
      it('should partially update a project', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const result = await adapter.updateProjectPartial(project.projectId, {
          name: 'Partial Update',
        });

        expect(result.success).toBe(true);
        expect(result.data.name).toBe('Partial Update');
        expect(result.data.projectId).toBe(project.projectId); // Other fields preserved
      });

      it('should merge updates with existing data', async () => {
        const project = createMockProject({ name: 'Original' });
        await adapter.createProject(project);

        await adapter.updateProjectPartial(project.projectId, {
          name: 'Modified',
          lastModified: 999,
        });

        const retrieved = await adapter.getProject(project.projectId);
        expect(retrieved.data.name).toBe('Modified');
        expect(retrieved.data.projectId).toBe(project.projectId);
      });
    });

    describe('deleteProject', () => {
      it('should delete an existing project', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const result = await adapter.deleteProject(project.projectId);
        expect(result.success).toBe(true);
      });

      it('should remove project from storage', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        await adapter.deleteProject(project.projectId);

        const result = await adapter.getProject(project.projectId);
        expect(result.success).toBe(false);
      });

      it('should return error for non-existent project', async () => {
        const result = await adapter.deleteProject('non-existent-id');
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should clear active project if it was deleted', async () => {
        const project1 = createMockProject();
        const project2 = createMockProject();

        await adapter.createProject(project1);
        await adapter.createProject(project2);

        // Set project1 as active
        const state = await adapter.loadStorageState();
        state.data.activeProjectId = project1.id;
        await adapter.saveStorageState(state.data);

        // Delete active project
        await adapter.deleteProject(project1.id);

        const newState = await adapter.loadStorageState();
        expect(newState.data.activeProjectId).not.toBe(project1.id);
      });
    });

    describe('projectExists', () => {
      it('should return true for existing project', async () => {
        const project = createMockProject();
        await adapter.createProject(project);

        const result = await adapter.projectExists(project.projectId);
        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
      });

      it('should return false for non-existent project', async () => {
        const result = await adapter.projectExists('non-existent-id');
        expect(result.success).toBe(true);
        expect(result.data).toBe(false);
      });
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    describe('getAllProjects', () => {
      it('should return entire storage state', async () => {
        const project1 = createMockProject();
        const project2 = createMockProject();

        await adapter.createProject(project1);
        await adapter.createProject(project2);

        const result = await adapter.getAllProjects();
        expect(result.success).toBe(true);
        expect(result.data.projectData).toHaveLength(2);
      });
    });

    describe('saveStorageState', () => {
      it('should save complete storage state', async () => {
        const project = createMockProject();
        const state: StorageState = {
          projectData: [project],
          activeProjectId: project.projectId,
        };

        const result = await adapter.saveStorageState(state);
        expect(result.success).toBe(true);

        const retrieved = await adapter.loadStorageState();
        expect(retrieved.data).toEqual(state);
      });

      it('should handle save errors', async () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('Storage full');
        });

        const state: StorageState = {
          projectData: [],
          activeProjectId: null,
        };

        const result = await adapter.saveStorageState(state);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Storage full');

        setItemSpy.mockRestore();
      });
    });

    describe('loadStorageState', () => {
      it('should load complete storage state', async () => {
        const project = createMockProject();
        const state: StorageState = {
          projectData: [project],
          activeProjectId: project.projectId,
        };

        await adapter.saveStorageState(state);
        const result = await adapter.loadStorageState();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(state);
      });

      it('should return empty state when no data exists', async () => {
        const result = await adapter.loadStorageState();
        expect(result.success).toBe(true);
        expect(result.data.projectData).toEqual([]);
        expect(result.data.activeProjectId).toBeNull();
      });

      it('should handle corrupted data', async () => {
        localStorage.setItem(storageKey, 'invalid json{');

        const result = await adapter.loadStorageState();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to load');
      });
    });
  });

  describe('Sync Operations', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should return sync status', () => {
      const status = adapter.getSyncStatus();

      expect(status).toHaveProperty('isSynced');
      expect(status).toHaveProperty('lastSyncTime');
      expect(status).toHaveProperty('pendingChanges');
    });

    it('should mark data as synced after operation', async () => {
      const status = adapter.getSyncStatus();
      expect(status.isSynced).toBe(true);
    });

    it('should sync successfully (localStorage always syncs)', async () => {
      const result = await adapter.sync();
      expect(result.success).toBe(true);
    });

    it('should clear pending changes', async () => {
      const project = createMockProject();
      await adapter.createProject(project);

      let status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBeGreaterThan(0);

      await adapter.clearPending();

      status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
    });
  });

  describe('isReady check', () => {
    it('should return false before initialization', () => {
      const newAdapter = new LocalStorageAdapter({ storageKey });
      expect(newAdapter.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await adapter.initialize();
      expect(adapter.isReady()).toBe(true);
    });
  });

  describe('close', () => {
    it('should close adapter without errors', async () => {
      await adapter.initialize();
      await expect(adapter.close()).resolves.toBeUndefined();
    });
  });

  describe('Data Integrity', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should maintain data integrity across multiple operations', async () => {
      const projects = [
        createMockProject({ name: 'Project 1' }),
        createMockProject({ name: 'Project 2' }),
        createMockProject({ name: 'Project 3' }),
      ];

      for (const project of projects) {
        await adapter.createProject(project);
      }

      const result = await adapter.getProjects();
      expect(result.data).toHaveLength(3);

      // Update one
      projects[0].name = 'Updated Project 1';
      await adapter.updateProject(projects[0].id, projects[0]);

      // Delete one
      await adapter.deleteProject(projects[1].id);

      const final = await adapter.getProjects();
      expect(final.data).toHaveLength(2);
      expect(final.data[0].name).toBe('Updated Project 1');
    });

    it('should preserve data across adapter recreation', async () => {
      const project = createMockProject();
      await adapter.createProject(project);

      // Create new adapter with same storage key
      const newAdapter = new LocalStorageAdapter({ storageKey });
      await newAdapter.initialize();

      const result = await newAdapter.getProject(project.projectId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(project);
    });
  });
});
