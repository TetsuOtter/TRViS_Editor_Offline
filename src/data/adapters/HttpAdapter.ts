/**
 * HTTP Adapter
 *
 * Implements IDataRepository using a backend HTTP API.
 * Placeholder for future backend integration.
 * Includes retry logic, offline support, and sync queuing.
 */

import { IDataRepository, Result, SyncStatus, RepositoryConfig } from '../types';
import { ProjectData, StorageState } from '../../types/storage';

interface PendingOperation {
  type: 'create' | 'update' | 'delete';
  projectId?: string;
  data?: ProjectData;
  timestamp: number;
}

export class HttpAdapter implements IDataRepository {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private isInitialized = false;
  private isOnline = navigator.onLine;
  private pendingOperations: PendingOperation[] = [];
  private onSyncError?: (error: string) => void;
  private syncStatus: SyncStatus = {
    isSynced: true,
    lastSyncTime: Date.now(),
    pendingChanges: 0,
  };

  constructor(config: RepositoryConfig) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required for HttpAdapter');
    }
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 5000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.onSyncError = config.onSyncError;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async initialize(): Promise<Result<void>> {
    try {
      // Test connection to backend
      const result = await this.makeRequest('GET', '/health');
      if (!result.success) {
        // Fall back to offline mode
        console.warn('Backend unavailable, operating in offline mode');
      }
      this.isInitialized = true;
      return { success: true, data: undefined };
    } catch (error) {
      console.warn('HttpAdapter initialization failed, will use offline mode');
      this.isInitialized = true;
      return { success: true, data: undefined };
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Project CRUD Operations

  async getProjects(): Promise<Result<ProjectData[]>> {
    try {
      const result = await this.makeRequest<{ projects: ProjectData[] }>(
        'GET',
        '/api/projects'
      );
      if (!result.success) return result;
      return { success: true, data: result.data.projects };
    } catch (error) {
      return { success: false, error: `Failed to get projects: ${String(error)}` };
    }
  }

  async getProject(projectId: string): Promise<Result<ProjectData>> {
    try {
      return this.makeRequest<ProjectData>('GET', `/api/projects/${projectId}`);
    } catch (error) {
      return { success: false, error: `Failed to get project: ${String(error)}` };
    }
  }

  async createProject(project: ProjectData): Promise<Result<ProjectData>> {
    try {
      const result = await this.makeRequest<ProjectData>(
        'POST',
        '/api/projects',
        project
      );

      if (result.success) {
        this.syncStatus.isSynced = true;
      } else {
        this.queuePendingOperation('create', project.id, project);
      }

      return result;
    } catch (error) {
      this.queuePendingOperation('create', project.id, project);
      return { success: false, error: `Failed to create project: ${String(error)}` };
    }
  }

  async updateProject(projectId: string, project: ProjectData): Promise<Result<ProjectData>> {
    try {
      const result = await this.makeRequest<ProjectData>(
        'PUT',
        `/api/projects/${projectId}`,
        project
      );

      if (result.success) {
        this.syncStatus.isSynced = true;
      } else {
        this.queuePendingOperation('update', projectId, project);
      }

      return result;
    } catch (error) {
      this.queuePendingOperation('update', projectId, project);
      return { success: false, error: `Failed to update project: ${String(error)}` };
    }
  }

  async updateProjectPartial(
    projectId: string,
    updates: Partial<ProjectData>
  ): Promise<Result<ProjectData>> {
    try {
      const getResult = await this.getProject(projectId);
      if (!getResult.success) return getResult;

      const updatedProject = { ...getResult.data, ...updates };
      return this.updateProject(projectId, updatedProject);
    } catch (error) {
      return { success: false, error: `Failed to partially update project: ${String(error)}` };
    }
  }

  async deleteProject(projectId: string): Promise<Result<void>> {
    try {
      const result = await this.makeRequest<void>('DELETE', `/api/projects/${projectId}`);

      if (result.success) {
        this.syncStatus.isSynced = true;
      } else {
        this.queuePendingOperation('delete', projectId);
      }

      return result;
    } catch (error) {
      this.queuePendingOperation('delete', projectId);
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
    try {
      const projectsResult = await this.getProjects();
      if (!projectsResult.success) return projectsResult;

      return {
        success: true,
        data: {
          projectData: projectsResult.data,
          activeProjectId: projectsResult.data[0]?.id || null,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to get all projects: ${String(error)}` };
    }
  }

  async saveStorageState(state: StorageState): Promise<Result<void>> {
    try {
      return this.makeRequest<void>('POST', '/api/storage/save', state);
    } catch (error) {
      this.queuePendingOperation('create', '', undefined);
      return { success: false, error: `Failed to save storage state: ${String(error)}` };
    }
  }

  async loadStorageState(): Promise<Result<StorageState>> {
    try {
      return this.makeRequest<StorageState>('GET', '/api/storage/load');
    } catch (error) {
      return { success: false, error: `Failed to load storage state: ${String(error)}` };
    }
  }

  // Sync Operations

  getSyncStatus(): SyncStatus {
    return {
      ...this.syncStatus,
      pendingChanges: this.pendingOperations.length,
    };
  }

  async sync(): Promise<Result<void>> {
    if (!this.isOnline || this.pendingOperations.length === 0) {
      this.syncStatus.isSynced = true;
      return { success: true, data: undefined };
    }

    try {
      for (const operation of this.pendingOperations) {
        const result = await this.replaySyncOperation(operation);
        if (!result.success) {
          this.syncStatus.isSynced = false;
          this.syncStatus.syncError = result.error;
          if (this.onSyncError) {
            this.onSyncError(result.error);
          }
          return result;
        }
      }

      this.pendingOperations = [];
      this.syncStatus.isSynced = true;
      this.syncStatus.syncError = undefined;
      this.syncStatus.lastSyncTime = Date.now();
      return { success: true, data: undefined };
    } catch (error) {
      const errorMsg = `Sync failed: ${String(error)}`;
      this.syncStatus.syncError = errorMsg;
      if (this.onSyncError) {
        this.onSyncError(errorMsg);
      }
      return { success: false, error: errorMsg };
    }
  }

  async clearPending(): Promise<Result<void>> {
    this.pendingOperations = [];
    this.syncStatus.pendingChanges = 0;
    return { success: true, data: undefined };
  }

  // Cleanup

  async close(): Promise<void> {
    // Cleanup if needed
  }

  // Private Helpers

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<Result<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryAttempts - 1) {
          await this.delay(this.retryDelay * (attempt + 1));
        }
      }
    }

    return { success: false, error: `Request failed: ${lastError?.message || 'Unknown error'}` };
  }

  private queuePendingOperation(
    type: 'create' | 'update' | 'delete',
    projectId?: string,
    data?: ProjectData
  ): void {
    this.pendingOperations.push({
      type,
      projectId,
      data,
      timestamp: Date.now(),
    });
    this.syncStatus.isSynced = false;
    this.syncStatus.pendingChanges = this.pendingOperations.length;
  }

  private async replaySyncOperation(operation: PendingOperation): Promise<Result<void>> {
    switch (operation.type) {
      case 'create':
        if (operation.data) {
          const result = await this.makeRequest<ProjectData>(
            'POST',
            '/api/projects',
            operation.data
          );
          return result.success ? { success: true, data: undefined } : result;
        }
        return { success: true, data: undefined };

      case 'update':
        if (operation.projectId && operation.data) {
          const result = await this.makeRequest<ProjectData>(
            'PUT',
            `/api/projects/${operation.projectId}`,
            operation.data
          );
          return result.success ? { success: true, data: undefined } : result;
        }
        return { success: true, data: undefined };

      case 'delete':
        if (operation.projectId) {
          const result = await this.makeRequest<void>('DELETE', `/api/projects/${operation.projectId}`);
          return result;
        }
        return { success: true, data: undefined };

      default:
        return { success: false, error: 'Unknown operation type' };
    }
  }

  private async handleOnline(): Promise<void> {
    if (this.pendingOperations.length > 0) {
      await this.sync();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
