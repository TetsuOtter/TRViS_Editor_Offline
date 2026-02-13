/**
 * Storage format types for LocalStorage/IDB
 */

import type { Database } from './trvis';
import type { EditorMetadata, Project } from './editor';

export interface ProjectData {
  projectId: string;
  name: string;
  database: Database;
  metadata: EditorMetadata;
  createdAt: number;
  lastModified: number;
}

export interface StorageState {
  projects: Project[];
  projectData: Record<string, ProjectData>;
  activeProjectId: string | null;
}
