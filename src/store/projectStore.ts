import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '../types/editor';
import type { ProjectData } from '../types/storage';
import type { Database } from '../types/trvis';

interface ProjectState {
  projects: Project[];
  projectData: Record<string, ProjectData>;
  activeProjectId: string | null;

  // Actions
  createProject: (name: string) => string;
  deleteProject: (projectId: string) => void;
  setActiveProject: (projectId: string) => void;
  updateProjectData: (projectId: string, database: Database) => void;
  getActiveProjectData: () => ProjectData | null;
  getProject: (projectId: string) => Project | null;
  getProjectData: (projectId: string) => ProjectData | null;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      projectData: {},
      activeProjectId: null,

      createProject: (name: string) => {
        const { projects, projectData } = get();
        const projectId = crypto.randomUUID();
        const now = Date.now();

        const newProject: Project = {
          id: projectId,
          name,
          createdAt: now,
          lastModified: now,
        };

        const newProjectData: ProjectData = {
          projectId,
          name,
          database: [],
          metadata: {
            stations: [],
            lines: [],
            trainTypePatterns: [],
          },
          createdAt: now,
          lastModified: now,
        };

        set({
          projects: [...projects, newProject],
          projectData: {
            ...projectData,
            [projectId]: newProjectData,
          },
          activeProjectId: projectId,
        });

        return projectId;
      },

      deleteProject: (projectId: string) => {
        const { projects, projectData, activeProjectId } = get();

        const updatedProjects = projects.filter((p) => p.id !== projectId);
        const updatedProjectData = { ...projectData };
        delete updatedProjectData[projectId];

        let newActiveProjectId = activeProjectId;
        if (activeProjectId === projectId) {
          newActiveProjectId = updatedProjects.length > 0 ? updatedProjects[0].id : null;
        }

        set({
          projects: updatedProjects,
          projectData: updatedProjectData,
          activeProjectId: newActiveProjectId,
        });
      },

      setActiveProject: (projectId: string) => {
        const { projects } = get();
        if (projects.find((p) => p.id === projectId)) {
          set({ activeProjectId: projectId });
        }
      },

      updateProjectData: (projectId: string, database: Database) => {
        const { projectData } = get();
        const current = projectData[projectId];

        if (current) {
          set({
            projectData: {
              ...projectData,
              [projectId]: {
                ...current,
                database,
                lastModified: Date.now(),
              },
            },
          });
        }
      },

      getActiveProjectData: () => {
        const { projectData, activeProjectId } = get();
        if (!activeProjectId) return null;
        return projectData[activeProjectId] || null;
      },

      getProject: (projectId: string) => {
        const { projects } = get();
        return projects.find((p) => p.id === projectId) || null;
      },

      getProjectData: (projectId: string) => {
        const { projectData } = get();
        return projectData[projectId] || null;
      },
    }),
    {
      name: 'trvis-projects',
    }
  )
);
