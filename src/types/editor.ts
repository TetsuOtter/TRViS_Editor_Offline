/**
 * Editor-specific types (not part of TRViS JSON schema)
 * These are stored in LocalStorage/IDB
 */

export interface Station {
  id: string;
  name: string;
  fullName?: string;
  longitude?: number;
  latitude?: number;
}

export interface LineStation {
  stationId: string;
  distanceFromStart_m: number;
}

export interface Line {
  id: string;
  name: string;
  stations: LineStation[];
}

export interface TrainTypeIntervalPattern {
  fromStationId: string;
  toStationId: string;
  driveTime_MM: number;
  driveTime_SS: number;
}

export interface TrainTypePattern {
  id: string;
  lineId: string;
  typeName: string;
  intervals: TrainTypeIntervalPattern[];
}

export interface EditorMetadata {
  stations: Station[];
  lines: Line[];
  trainTypePatterns: TrainTypePattern[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
}

/**
 * Time display settings for TimetableRow Arrive/Departure times
 * Stored separately from TimetableRow to allow flexible display options
 */
export interface TimeDisplaySettings {
  showTime: boolean; // Whether to display time at all
  showHours: boolean; // Whether to show HH part (if false, format as :MM:SS)
  showArrowForPass: boolean; // Whether to show "↓" instead of time for pass stations
  customText?: string; // Custom text to display instead of time (if set, this takes precedence)
}

/**
 * Extended timetable row with display settings
 * Combines TimetableRow with display configuration
 */
export interface TimetableRowWithSettings {
  row: import('../types/trvis').TimetableRow;
  arriveSettings?: TimeDisplaySettings;
  departureSettings?: TimeDisplaySettings;
}
