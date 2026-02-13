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
