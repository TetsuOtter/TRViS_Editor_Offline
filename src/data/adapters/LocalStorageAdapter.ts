/**
 * LocalStorage Adapter
 *
 * Implements IDataRepository using browser's localStorage.
 * Current production implementation for offline-first functionality.
 */

import type { IDataRepository, Result, SyncStatus, RepositoryConfig } from '../types';
import type { ProjectData, StorageState } from '../../types/storage';

export class LocalStorageAdapter implements IDataRepository {
  private storageKey: string;
  private isInitialized = false;
  private syncStatus: SyncStatus = {
    isSynced: true,
    lastSyncTime: Date.now(),
    pendingChanges: 0,
  };

  constructor(config: RepositoryConfig) {
    this.storageKey = config.storageKey || 'trvis-projects';
  }

  async initialize(): Promise<Result<void>> {
    try {
      // Verify localStorage is available
      if (!this.isLocalStorageAvailable()) {
        return { success: false, error: 'localStorage is not available' };
      }

      // Validate existing data structure
      const existingData = localStorage.getItem(this.storageKey);
      if (existingData) {
        try {
          JSON.parse(existingData);
        } catch {
          return { success: false, error: 'Corrupted localStorage data' };
        }
      }

      this.isInitialized = true;
      this.syncStatus.lastSyncTime = Date.now();
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: `Initialization failed: ${String(error)}` };
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.isLocalStorageAvailable();
  }

  // Project CRUD Operations

  async getProjects(): Promise<Result<ProjectData[]>> {
    try {
      const state = await this.loadStorageState();
      if (!state.success) return { success: false, error: state.error };
      return { success: true, data: state.data!.projectData };
    } catch (error) {
      return { success: false, error: `Failed to get projects: ${String(error)}` };
    }
  }

  async getProject(projectId: string): Promise<Result<ProjectData>> {
    try {
      const state = await this.loadStorageState();
      if (!state.success) return { success: false, error: state.error };

      const project = state.data!.projectData.find(p => p.projectId === projectId);
      if (!project) {
        return { success: false, error: `Project ${projectId} not found` };
      }
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: `Failed to get project: ${String(error)}` };
    }
  }

  async createProject(project: ProjectData): Promise<Result<ProjectData>> {
    try {
      const state = await this.loadStorageState();
      if (!state.success) return { success: false, error: state.error };

      // Check for duplicate
      if (state.data!.projectData.some(p => p.projectId === project.projectId)) {
        return { success: false, error: `Project ${project.projectId} already exists` };
      }

      state.data!.projectData.push(project);
      const saveResult = await this.saveStorageState(state.data!);
      if (!saveResult.success) return { success: false, error: saveResult.error };

      this.markPendingChange();
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: `Failed to create project: ${String(error)}` };
    }
  }

  async updateProject(projectId: string, project: ProjectData): Promise<Result<ProjectData>> {
    try {
      const state = await this.loadStorageState();
      if (!state.success) return { success: false, error: state.error };

      const index = state.data!.projectData.findIndex(p => p.projectId === projectId);
      if (index === -1) {
        return { success: false, error: `Project ${projectId} not found` };
      }

      state.data!.projectData[index] = project;
      const saveResult = await this.saveStorageState(state.data!);
      if (!saveResult.success) return { success: false, error: saveResult.error };

      this.markPendingChange();
      return { success: true, data: project };
    } catch (error) {
      return { success: false, error: `Failed to update project: ${String(error)}` };
    }
  }

  async updateProjectPartial(projectId: string, updates: Partial<ProjectData>): Promise<Result<ProjectData>> {
    try {
      const getResult = await this.getProject(projectId);
      if (!getResult.success) return { success: false, error: getResult.error };

      const updatedProject: ProjectData = { ...getResult.data!, ...updates };
      return this.updateProject(projectId, updatedProject);
    } catch (error) {
      return { success: false, error: `Failed to partially update project: ${String(error)}` };
    }
  }

  async deleteProject(projectId: string): Promise<Result<void>> {
    try {
      const state = await this.loadStorageState();
      if (!state.success) return { success: false, error: state.error };

      const initialLength = state.data!.projectData.length;
      state.data!.projectData = state.data!.projectData.filter(p => p.projectId !== projectId);

      if (state.data!.projectData.length === initialLength) {
        return { success: false, error: `Project ${projectId} not found` };
      }

      // Update active project if it was deleted
      if (state.data!.activeProjectId === projectId) {
        state.data!.activeProjectId = state.data!.projectData[0]?.projectId || null;
      }

      const saveResult = await this.saveStorageState(state.data!);
      if (!saveResult.success) return { success: false, error: saveResult.error };

      this.markPendingChange();
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: `Failed to delete project: ${String(error)}` };
    }
  }

  async projectExists(projectId: string): Promise<Result<boolean>> {
    try {
      const result = await this.getProject(projectId);
      return { success: true, data: result.success };
    } catch (error) {
      return { success: false, error: `Failed to check project existence: ${String(error)}` };
    }
  }

  // Batch Operations

  async getAllProjects(): Promise<Result<StorageState>> {
    return this.loadStorageState();
  }

  async saveStorageState(state: StorageState): Promise<Result<void>> {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(this.storageKey, serialized);
      this.syncStatus.lastSyncTime = Date.now();
      return { success: true, data: undefined };
    } catch (error) {
      const errorMsg = `Failed to save storage state: ${String(error)}`;
      this.syncStatus.syncError = errorMsg;
      return { success: false, error: errorMsg };
    }
  }

  async loadStorageState(): Promise<Result<StorageState>> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        // Return empty state if no data exists
        return {
          success: true,
          data: {
            projectData: [],
            activeProjectId: null,
          },
        };
      }

      const parsed = JSON.parse(data) as StorageState;
      this.syncStatus.lastSyncTime = Date.now();
      return { success: true, data: parsed };
    } catch (error) {
      const errorMsg = `Failed to load storage state: ${String(error)}`;
      this.syncStatus.syncError = errorMsg;
      return { success: false, error: errorMsg };
    }
  }

  // Sync Operations

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async sync(): Promise<Result<void>> {
    // LocalStorage is always in sync
    this.syncStatus.isSynced = true;
    this.syncStatus.pendingChanges = 0;
    this.syncStatus.syncError = undefined;
    return { success: true, data: undefined };
  }

  async clearPending(): Promise<Result<void>> {
    this.syncStatus.pendingChanges = 0;
    return { success: true, data: undefined };
  }

  // Cleanup

  async close(): Promise<void> {
    // No cleanup needed for localStorage
  }

  // Private Helpers

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private markPendingChange(): void {
    this.syncStatus.pendingChanges += 1;
  }
}
