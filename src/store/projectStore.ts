import { create } from 'zustand';
import type { Project, EditorMetadata } from '../types/editor';
import type { ProjectData, DatabaseWithSettings } from '../types/storage';
import type { Database } from '../types/trvis';
import type { IDataRepository } from '../data/types';
import { repositoryFactory } from '../data/RepositoryFactory';
import { v4 as uuidv4 } from 'uuid';
import { convertToEditorDatabase } from '../utils/jsonIO';

// Helper to detect if a row is in editor format (has numeric times)
const isRowInEditorFormat = (row: any): boolean => {
  return typeof row.Arrive === 'number' || typeof row.Departure === 'number';
};

// Helper to check if any row in a train is in editor format
const isTrainInEditorFormat = (train: any): boolean => {
  return train.TimetableRows && train.TimetableRows.length > 0 && 
    train.TimetableRows.some((row: any) => isRowInEditorFormat(row));
};

// Helper to check if any train in a work is in editor format
const isWorkInEditorFormat = (work: any): boolean => {
  return work.Trains && work.Trains.length > 0 && 
    work.Trains.some((train: any) => isTrainInEditorFormat(train));
};

// Helper to check if any work in a workgroup is in editor format
const isWorkGroupInEditorFormat = (workGroup: any): boolean => {
  return workGroup.Works && workGroup.Works.length > 0 && 
    workGroup.Works.some((work: any) => isWorkInEditorFormat(work));
};

// Helper to check if any workgroup in a database is in editor format
const isDatabaseInEditorFormat = (database: any[]): boolean => {
  return database && database.length > 0 && 
    database.some((workGroup: any) => isWorkGroupInEditorFormat(workGroup));
};

// Helper to ensure database is in editor format
const ensureDatabaseWithSettings = (database: Database | DatabaseWithSettings): DatabaseWithSettings => {
  // If it's already in editor format, return as-is
  if (isDatabaseInEditorFormat(database as any[])) {
    return database as DatabaseWithSettings;
  }
  // Otherwise convert from JSON format
  return convertToEditorDatabase(database as Database);
};

interface ProjectState {
  projects: Project[];
  projectData: Record<string, ProjectData>;
  activeProjectId: string | null;
  isInitialized: boolean;
  isSyncing: boolean;

  // Initialization
  initialize: () => Promise<void>;

  // Actions
  createProject: (name: string) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  setActiveProject: (projectId: string) => Promise<void>;
  clearActiveProject: () => void;
  updateProjectData: (projectId: string, database: Database | DatabaseWithSettings) => Promise<void>;
  updateProjectMetadata: (projectId: string, metadata: EditorMetadata) => Promise<void>;

  // Queries
  getActiveProjectData: () => ProjectData | null;
  getProject: (projectId: string) => Project | null;
  getProjectData: (projectId: string) => ProjectData | null;

  // Sync
  syncToRepository: () => Promise<void>;
  reloadFromRepository: () => Promise<void>;
}

/**
 * Project Store with Repository Integration
 *
 * Uses IDataRepository abstraction to support both localStorage and future backend.
 * Maintains Zustand state for UI reactivity while delegating persistence to repository.
 */
export const useProjectStore = create<ProjectState>((set, get) => {
  let repository: IDataRepository | null = null;

  const getRepository = async (): Promise<IDataRepository> => {
    if (!repository) {
      repository = repositoryFactory.getDefaultRepository();
      const result = await repository.initialize();
      if (!result.success) {
        throw new Error(`Failed to initialize repository: ${result.error}`);
      }
    }
    return repository;
  };

  return {
    projects: [],
    projectData: {},
    activeProjectId: null,
    isInitialized: false,
    isSyncing: false,

    initialize: async () => {
      try {
        const repo = await getRepository();
        const result = await repo.loadStorageState();

        if (!result.success) {
          throw new Error(`Failed to load projects: ${result.error}`);
        }

        // Convert ProjectData array to record
        const projectDataRecord: Record<string, ProjectData> = {};
        for (const projectData of result.data!.projectData) {
          projectDataRecord[projectData.projectId] = projectData;
        }

        // Build Project array from ProjectData
        const projects: Project[] = result.data!.projectData.map(pd => ({
          id: pd.projectId,
          name: pd.name,
          createdAt: pd.createdAt,
          lastModified: pd.lastModified,
        }));

        set({
          projects,
          projectData: projectDataRecord,
          activeProjectId: result.data!.activeProjectId,
          isInitialized: true,
        });
      } catch (error) {
        console.error('Failed to initialize project store:', error);
        set({ isInitialized: true }); // Mark as initialized even on error
      }
    },

    createProject: async (name: string) => {
      const repo = await getRepository();
      const projectId = uuidv4();
      const now = Date.now();

      const newProjectData: ProjectData = {
        projectId,
        name,
        createdAt: now,
        lastModified: now,
        database: [],
        metadata: {
          stations: [],
          lines: [],
          trainTypePatterns: [],
        },
      };

      const result = await repo.createProject(newProjectData);
      if (!result.success) {
        throw new Error(`Failed to create project: ${result.error}`);
      }

      // Update local state
      set(state => ({
        projects: [
          ...state.projects,
          {
            id: projectId,
            name,
            createdAt: now,
            lastModified: now,
          },
        ],
        projectData: {
          ...state.projectData,
          [projectId]: newProjectData,
        },
        activeProjectId: projectId,
      }));

      return projectId;
    },

    deleteProject: async (projectId: string) => {
      const repo = await getRepository();
      const result = await repo.deleteProject(projectId);

      // Silently handle "not found" — the project may not have been persisted
      if (!result.success && !result.error?.includes('not found')) {
        throw new Error(`Failed to delete project: ${result.error}`);
      }

      set(state => {
        const updatedProjects = state.projects.filter(p => p.id !== projectId);
        const updatedProjectData = { ...state.projectData };
        delete updatedProjectData[projectId];

        let newActiveProjectId = state.activeProjectId;
        if (state.activeProjectId === projectId) {
          newActiveProjectId = updatedProjects.length > 0 ? updatedProjects[0].id : null;
        }

        return {
          projects: updatedProjects,
          projectData: updatedProjectData,
          activeProjectId: newActiveProjectId,
        };
      });
    },

    setActiveProject: async (projectId: string) => {
      const { projects } = get();
      if (!projects.find(p => p.id === projectId)) {
        throw new Error(`Project ${projectId} not found`);
      }

      set({ activeProjectId: projectId });

      // Persist to repository
      const repo = await getRepository();
      const state = get();
      await repo.saveStorageState({
        projectData: Object.values(state.projectData),
        activeProjectId: projectId,
      });
    },

    clearActiveProject: () => {
      set({ activeProjectId: null });
    },

    updateProjectData: async (projectId: string, database: Database | DatabaseWithSettings) => {
      const repo = await getRepository();
      const { projectData } = get();
      const current = projectData[projectId];

      if (!current) {
        throw new Error(`Project ${projectId} not found`);
      }

      const normalizedDatabase = ensureDatabaseWithSettings(database);

      const updated: ProjectData = {
        ...current,
        database: normalizedDatabase,
        lastModified: Date.now(),
      };

      const result = await repo.updateProject(projectId, updated);
      if (!result.success) {
        throw new Error(`Failed to update project: ${result.error}`);
      }

      set({
        projectData: {
          ...projectData,
          [projectId]: updated,
        },
      });
    },

    updateProjectMetadata: async (projectId: string, metadata: EditorMetadata) => {
      const repo = await getRepository();
      const { projectData } = get();
      const current = projectData[projectId];

      if (!current) {
        throw new Error(`Project ${projectId} not found`);
      }

      const updated: ProjectData = {
        ...current,
        metadata,
        lastModified: Date.now(),
      };

      const result = await repo.updateProject(projectId, updated);
      if (!result.success) {
        throw new Error(`Failed to update project metadata: ${result.error}`);
      }

      set({
        projectData: {
          ...projectData,
          [projectId]: updated,
        },
      });
    },

    getActiveProjectData: () => {
      const { projectData, activeProjectId } = get();
      if (!activeProjectId) return null;
      return projectData[activeProjectId] || null;
    },

    getProject: (projectId: string) => {
      const { projects } = get();
      return projects.find(p => p.id === projectId) || null;
    },

    getProjectData: (projectId: string) => {
      const { projectData } = get();
      return projectData[projectId] || null;
    },

    syncToRepository: async () => {
      if (!repository) return;

      set({ isSyncing: true });
      try {
        const state = get();
        const result = await repository.saveStorageState({
          projectData: Object.values(state.projectData),
          activeProjectId: state.activeProjectId,
        });

        if (!result.success) {
          throw new Error(`Sync failed: ${result.error}`);
        }

        await repository.sync();
      } finally {
        set({ isSyncing: false });
      }
    },

    reloadFromRepository: async () => {
      const repo = await getRepository();
      const result = await repo.loadStorageState();

      if (!result.success) {
        throw new Error(`Failed to reload projects: ${result.error}`);
      }

      const projectDataRecord: Record<string, ProjectData> = {};
      for (const projectData of result.data!.projectData) {
        projectDataRecord[projectData.projectId] = projectData;
      }

      const projects: Project[] = result.data!.projectData.map(pd => ({
        id: pd.projectId,
        name: pd.name,
        createdAt: pd.createdAt,
        lastModified: pd.lastModified,
      }));

      set({
        projects,
        projectData: projectDataRecord,
        activeProjectId: result.data!.activeProjectId,
      });
    },
  };
});
