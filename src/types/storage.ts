/**
 * Storage format types for LocalStorage/IDB
 */

import type { Database } from './trvis';
import type { EditorMetadata } from './editor';

export interface ProjectData {
  projectId: string;
  name: string;
  database: Database;
  metadata: EditorMetadata;
  createdAt: number;
  lastModified: number;
}

export interface StorageState {
  projectData: ProjectData[];
  activeProjectId: string | null;
}
