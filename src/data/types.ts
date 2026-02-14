/**
 * Data Repository Types and Interfaces
 *
 * This module defines the abstraction layer for data persistence.
 * It supports both localStorage (current) and backend HTTP (future) implementations.
 */

import type { ProjectData, StorageState } from '../types/storage';

/**
 * Operation result type for handling success/failure cases
 */
export type Result<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Sync status tracking for data consistency
 */
export interface SyncStatus {
  isSynced: boolean;
  lastSyncTime: number; // Unix timestamp
  pendingChanges: number; // Count of unsaved changes
  syncError?: string;
}

/**
 * Options for query operations
 */
export interface QueryOptions {
  includeMetadata?: boolean;
  includeSyncStatus?: boolean;
}

/**
 * Repository interface for project data persistence
 * Abstracts the underlying storage mechanism (localStorage, HTTP, etc.)
 */
export interface IDataRepository {
  /**
   * Initialize the repository (e.g., load from storage, connect to backend)
   */
  initialize(): Promise<Result<void>>;

  /**
   * Check if repository is ready
   */
  isReady(): boolean;

  // Project CRUD Operations

  /**
   * Get all projects metadata
   */
  getProjects(): Promise<Result<ProjectData[]>>;

  /**
   * Get a specific project by ID
   */
  getProject(projectId: string): Promise<Result<ProjectData>>;

  /**
   * Create a new project
   */
  createProject(project: ProjectData): Promise<Result<ProjectData>>;

  /**
   * Update project (full replace)
   */
  updateProject(projectId: string, project: ProjectData): Promise<Result<ProjectData>>;

  /**
   * Partial update of project (merge with existing)
   */
  updateProjectPartial(projectId: string, updates: Partial<ProjectData>): Promise<Result<ProjectData>>;

  /**
   * Delete a project
   */
  deleteProject(projectId: string): Promise<Result<void>>;

  /**
   * Check if project exists
   */
  projectExists(projectId: string): Promise<Result<boolean>>;

  // Batch Operations

  /**
   * Get all projects in a single operation
   */
  getAllProjects(): Promise<Result<StorageState>>;

  /**
   * Save complete storage state (for backup/sync)
   */
  saveStorageState(state: StorageState): Promise<Result<void>>;

  /**
   * Load complete storage state (for restore/initial load)
   */
  loadStorageState(): Promise<Result<StorageState>>;

  // Sync Operations

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus;

  /**
   * Force synchronization with backend (if applicable)
   */
  sync(): Promise<Result<void>>;

  /**
   * Clear all local changes (for fresh start)
   */
  clearPending(): Promise<Result<void>>;

  // Cleanup

  /**
   * Close repository connection and cleanup resources
   */
  close(): Promise<void>;
}

/**
 * Configuration for repository adapters
 */
export interface RepositoryConfig {
  type: 'localStorage' | 'http';
  storageKey?: string; // For localStorage
  baseUrl?: string; // For HTTP
  timeout?: number; // Request timeout in ms
  retryAttempts?: number;
  retryDelay?: number;
  onSyncError?: (error: string) => void;
}

/**
 * Adapter factory for creating repository instances
 */
export interface IRepositoryFactory {
  createRepository(config: RepositoryConfig): IDataRepository;
}
