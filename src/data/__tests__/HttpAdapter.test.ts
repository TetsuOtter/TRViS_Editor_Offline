/**
 * Unit Tests for HttpAdapter
 *
 * Tests API communication, retry logic, offline handling, and sync operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpAdapter } from '../adapters/HttpAdapter';
import { ProjectData } from '../../types/storage';
import { v4 as uuidv4 } from 'uuid';

describe('HttpAdapter', () => {
  let adapter: HttpAdapter;
  const baseUrl = 'http://localhost:3000';

  const createMockProject = (overrides?: Partial<ProjectData>): ProjectData => ({
    id: uuidv4(),
    name: 'Test Project',
    createdAt: Date.now(),
    lastModified: Date.now(),
    database: { workGroups: [] },
    metadata: {
      stations: [],
      lines: [],
      trainTypePatterns: [],
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new HttpAdapter({
      type: 'http',
      baseUrl,
      timeout: 1000,
      retryAttempts: 2,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      ));

      const result = await adapter.initialize();
      expect(result.success).toBe(true);
      expect(adapter.isReady()).toBe(true);
    });

    it('should initialize in offline mode on failure', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

      const result = await adapter.initialize();
      expect(result.success).toBe(true); // Still succeeds, enters offline mode
      expect(adapter.isReady()).toBe(true);
    });
  });

  describe('createProject', () => {
    it('should create project via HTTP', async () => {
      const project = createMockProject();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(project),
        })
      );
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();
      const result = await adapter.createProject(project);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(project);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/projects`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(project),
        })
      );
    });

    it('should queue operation on network failure', async () => {
      const project = createMockProject();
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

      await adapter.initialize();
      const result = await adapter.createProject(project);

      expect(result.success).toBe(false);

      const status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBeGreaterThan(0);
      expect(status.isSynced).toBe(false);
    });

    it('should retry failed requests', async () => {
      const project = createMockProject();
      let attempts = 0;
      const mockFetch = vi.fn(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(project),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();
      const result = await adapter.createProject(project);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const project = createMockProject();
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Persistent failure'))));

      await adapter.initialize();
      const result = await adapter.createProject(project);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent failure');
    });
  });

  describe('getProject', () => {
    it('should retrieve project from HTTP', async () => {
      const project = createMockProject();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(project),
        })
      );
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();
      const result = await adapter.getProject(project.id);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(project);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/projects/${project.id}`,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle 404 errors', async () => {
      const projectId = uuidv4();
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Not found'),
        })
      ));

      await adapter.initialize();
      const result = await adapter.getProject(projectId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 404');
    });
  });

  describe('updateProject', () => {
    it('should update project via HTTP', async () => {
      const project = createMockProject();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(project),
        })
      );
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();
      const result = await adapter.updateProject(project.id, project);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/projects/${project.id}`,
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should queue update on failure', async () => {
      const project = createMockProject();
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

      await adapter.initialize();
      const result = await adapter.updateProject(project.id, project);

      expect(result.success).toBe(false);
      const status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBeGreaterThan(0);
    });
  });

  describe('deleteProject', () => {
    it('should delete project via HTTP', async () => {
      const projectId = uuidv4();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();
      const result = await adapter.deleteProject(projectId);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/projects/${projectId}`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should queue delete on failure', async () => {
      const projectId = uuidv4();
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

      await adapter.initialize();
      const result = await adapter.deleteProject(projectId);

      expect(result.success).toBe(false);
      const status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBeGreaterThan(0);
    });
  });

  describe('Sync Operations', () => {
    it('should return sync status', async () => {
      await adapter.initialize();
      const status = adapter.getSyncStatus();

      expect(status).toHaveProperty('isSynced');
      expect(status).toHaveProperty('lastSyncTime');
      expect(status).toHaveProperty('pendingChanges');
    });

    it('should sync pending operations', async () => {
      const project = createMockProject();
      let calls = 0;
      const mockFetch = vi.fn(() => {
        calls++;
        if (calls === 1) {
          // Fail on first create
          return Promise.reject(new Error('Network error'));
        }
        // Succeed on sync retry
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(project),
        });
      });
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();

      // Create should fail and queue
      const createResult = await adapter.createProject(project);
      expect(createResult.success).toBe(false);

      // Mock online status
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      // Sync should succeed
      const syncResult = await adapter.sync();
      expect(syncResult.success).toBe(true);

      const status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
      expect(status.isSynced).toBe(true);
    });

    it('should clear pending operations', async () => {
      const project = createMockProject();
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

      await adapter.initialize();

      // Queue some operations
      await adapter.createProject(project);
      await adapter.updateProject(project.id, project);

      let status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBeGreaterThan(0);

      // Clear
      const result = await adapter.clearPending();
      expect(result.success).toBe(true);

      status = adapter.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
    });

    it('should handle online/offline transitions', async () => {
      const mockFetch = vi.fn(() => Promise.reject(new Error('Network error')));
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      const project = createMockProject();
      await adapter.createProject(project);

      let status = adapter.getSyncStatus();
      expect(status.isSynced).toBe(false);

      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      // Simulate the online event handler
      const event = new Event('online');
      window.dispatchEvent(event);

      // Give async handler time to run
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Request Timeout', () => {
    it('should timeout long requests', async () => {
      const mockFetch = vi.fn(() => new Promise(() => {})); // Never resolves
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();

      const project = createMockProject();
      const result = await adapter.createProject(project);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request failed');
    });
  });

  describe('HTTP Error Handling', () => {
    it('should handle 500 errors', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal server error'),
        })
      ));

      await adapter.initialize();

      const project = createMockProject();
      const result = await adapter.createProject(project);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 500');
    });

    it('should handle invalid JSON responses', async () => {
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON')),
        })
      ));

      await adapter.initialize();

      const project = createMockProject();
      const result = await adapter.createProject(project);

      expect(result.success).toBe(false);
    });
  });

  describe('Error Callbacks', () => {
    it('should call onSyncError callback on sync failure', async () => {
      const onSyncError = vi.fn();
      const adapter2 = new HttpAdapter({
        type: 'http',
        baseUrl,
        retryAttempts: 1,
        onSyncError,
      });

      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Sync failed'))));

      await adapter2.initialize();

      const project = createMockProject();
      await adapter2.createProject(project);

      await adapter2.sync();

      expect(onSyncError).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should get all projects', async () => {
      const projects = [createMockProject(), createMockProject()];
      vi.stubGlobal('fetch', vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ projects }),
        })
      ));

      await adapter.initialize();
      const result = await adapter.getAllProjects();

      expect(result.success).toBe(true);
      expect(result.data.projectData).toEqual(projects);
    });

    it('should save and load storage state', async () => {
      const state = {
        projectData: [createMockProject()],
        activeProjectId: 'test-id',
      };

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(state),
        })
      );
      vi.stubGlobal('fetch', mockFetch);

      await adapter.initialize();

      // Save
      const saveResult = await adapter.saveStorageState(state);
      expect(saveResult.success).toBe(true);

      // Load
      const loadResult = await adapter.loadStorageState();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(state);
    });
  });

  describe('close', () => {
    it('should close adapter', async () => {
      await adapter.initialize();
      await expect(adapter.close()).resolves.toBeUndefined();
    });
  });
});
