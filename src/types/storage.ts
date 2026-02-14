/**
 * Storage format types for LocalStorage/IDB
 */

import type { TimetableRow } from './trvis';
import type { EditorMetadata, TimeDisplaySettings } from './editor';

/**
 * Extended TimetableRow for editor storage
 * Includes display settings for Arrive/Departure times
 * Arrive/Departure are stored as number (seconds) instead of strings for consistency
 */
export interface TimetableRowWithSettings extends Omit<TimetableRow, 'Arrive' | 'Departure'> {
  Arrive?: number;
  Departure?: number;
  arriveSettings?: TimeDisplaySettings;
  departureSettings?: TimeDisplaySettings;
}

/**
 * WorkGroup extended with editor-specific information
 * Uses TimetableRowWithSettings instead of TimetableRow
 */
export interface WorkWithSettings {
  Id?: string;
  Name: string;
  AffectDate?: string;
  AffixContentType?: number;
  AffixContent?: string;
  Remarks?: string;
  HasETrainTimetable?: boolean;
  ETrainTimetableContentType?: number;
  ETrainTimetableContent?: string;
  Trains: TrainWithSettings[];
  [key: string]: unknown;
}

/**
 * Train extended with editor-specific information
 */
export interface TrainWithSettings {
  Id?: string;
  TrainNumber: string;
  MaxSpeed?: string;
  SpeedType?: string;
  NominalTractiveCapacity?: string;
  CarCount?: number;
  Destination?: string;
  Direction: number;
  WorkType?: number;
  DayCount?: number;
  IsRideOnMoving?: boolean;
  Color?: string;
  BeginRemarks?: string;
  AfterRemarks?: string;
  Remarks?: string;
  BeforeDeparture?: string;
  AfterArrive?: string;
  TrainInfo?: string;
  NextTrainId?: string;
  TimetableRows: TimetableRowWithSettings[];
}

/**
 * WorkGroup extended with editor-specific information
 */
export interface WorkGroupWithSettings {
  Id?: string;
  Name: string;
  DBVersion?: number;
  Works: WorkWithSettings[];
}

export type DatabaseWithSettings = WorkGroupWithSettings[];

export interface ProjectData {
  projectId: string;
  name: string;
  database: DatabaseWithSettings;
  metadata: EditorMetadata;
  createdAt: number;
  lastModified: number;
}

export type Project = ProjectData;

export interface StorageState {
  projectData: ProjectData[];
  activeProjectId: string | null;
}
