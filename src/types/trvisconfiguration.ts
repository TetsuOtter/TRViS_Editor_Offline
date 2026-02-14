/**
 * TRViS Configuration/Settings Types
 * Settings interfaces that provide configuration for each TRViS data model
 * These are used for form inputs, validation rules, and UI preferences
 */

// TimetableRow Configuration
export interface TimetableRowConfig {
  // Identity & Reference
  id?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Station Information
  stationName?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  fullName?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Location Information
  location_m?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
    unit: string;
  };
  longitude_deg?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
  };
  latitude_deg?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
  };
  onStationDetectRadius_m?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    unit: string;
  };
  // Drive Time
  driveTime_MM?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
  };
  driveTime_SS?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
  };
  // Time Information
  arrive?: {
    enabled: boolean;
    required: boolean;
    description: string;
    format: string;
  };
  departure?: {
    enabled: boolean;
    required: boolean;
    description: string;
    format: string;
  };
  // Track Information
  trackName?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Stop Characteristics
  isOperationOnlyStop?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  isPass?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  hasBracket?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  isLastStop?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Run Limits
  runInLimit?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
  };
  runOutLimit?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
  };
  // Metadata
  recordType?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  workType?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  remarks?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Visual Indicators
  markerColor?: {
    enabled: boolean;
    required: boolean;
    description: string;
    format: string;
  };
  markerText?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
}

// Train Configuration
export interface TrainConfig {
  // Identity & Classification
  id?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  trainNumber?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Operational Details
  maxSpeed?: {
    enabled: boolean;
    required: boolean;
    description: string;
    unit: string;
  };
  speedType?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  nominalTractiveCapacity?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  carCount?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
    max?: number;
  };
  destination?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  direction?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Scheduling & Classification
  workType?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  dayCount?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
  };
  // Operational Flags
  isRideOnMoving?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Visual & Informational
  color?: {
    enabled: boolean;
    required: boolean;
    description: string;
    format: string;
  };
  beginRemarks?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  afterRemarks?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  remarks?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  trainInfo?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  beforeDeparture?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  afterArrive?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // References
  nextTrainId?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Timetable Rows
  timetableRows?: {
    enabled: boolean;
    required: boolean;
    description: string;
    minItems: number;
  };
}

// Work Configuration
export interface WorkConfig {
  // Identity & Reference
  id?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  name?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Scheduling
  affectDate?: {
    enabled: boolean;
    required: boolean;
    description: string;
    format: string;
  };
  // Content Extensions
  affixContentType?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  affixContent?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // E-Train Timetable
  hasETrainTimetable?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  eTrainTimetableContentType?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  eTrainTimetableContent?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Metadata
  remarks?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Trains
  trains?: {
    enabled: boolean;
    required: boolean;
    description: string;
    minItems: number;
  };
}

// WorkGroup Configuration
export interface WorkGroupConfig {
  // Identity & Reference
  id?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  name?: {
    enabled: boolean;
    required: boolean;
    description: string;
  };
  // Versioning
  dbVersion?: {
    enabled: boolean;
    required: boolean;
    description: string;
    min?: number;
  };
  // Works
  works?: {
    enabled: boolean;
    required: boolean;
    description: string;
    minItems: number;
  };
}

// Master Configuration Container
export interface TRViSConfiguration {
  timetableRow: TimetableRowConfig;
  train: TrainConfig;
  work: WorkConfig;
  workGroup: WorkGroupConfig;
}

// Default configuration factory
export const createDefaultTRViSConfiguration = (): TRViSConfiguration => ({
  timetableRow: {
    id: { enabled: true, required: false, description: 'Unique identifier for timetable row' },
    stationName: { enabled: true, required: true, description: 'Station name (short form)' },
    fullName: { enabled: true, required: false, description: 'Station full name' },
    location_m: { enabled: true, required: true, description: 'Location from start (meters)', min: 0, unit: 'm' },
    longitude_deg: { enabled: true, required: false, description: 'Longitude', min: -180, max: 180 },
    latitude_deg: { enabled: true, required: false, description: 'Latitude', min: -90, max: 90 },
    onStationDetectRadius_m: { enabled: true, required: false, description: 'Detection radius (meters)', min: 0, unit: 'm' },
    driveTime_MM: { enabled: true, required: false, description: 'Drive time minutes', min: 0, max: 99 },
    driveTime_SS: { enabled: true, required: false, description: 'Drive time seconds', min: 0, max: 59 },
    arrive: { enabled: true, required: false, description: 'Arrival time', format: 'HH:MM:SS' },
    departure: { enabled: true, required: false, description: 'Departure time', format: 'HH:MM:SS' },
    trackName: { enabled: true, required: false, description: 'Track/Platform name' },
    isOperationOnlyStop: { enabled: true, required: false, description: 'Operation-only stop flag' },
    isPass: { enabled: true, required: false, description: 'Pass-through flag' },
    hasBracket: { enabled: true, required: false, description: 'Has bracket indicator' },
    isLastStop: { enabled: true, required: false, description: 'Last stop flag' },
    runInLimit: { enabled: true, required: false, description: 'Run-in limit', min: 0, max: 999 },
    runOutLimit: { enabled: true, required: false, description: 'Run-out limit', min: 0, max: 999 },
    recordType: { enabled: true, required: false, description: 'Record type' },
    workType: { enabled: true, required: false, description: 'Work type' },
    remarks: { enabled: true, required: false, description: 'Additional remarks' },
    markerColor: { enabled: true, required: false, description: 'Marker color (hex)', format: '#RRGGBB' },
    markerText: { enabled: true, required: false, description: 'Marker text' },
  },
  train: {
    id: { enabled: true, required: false, description: 'Unique identifier for train' },
    trainNumber: { enabled: true, required: true, description: 'Train number/identifier' },
    maxSpeed: { enabled: true, required: false, description: 'Maximum speed', unit: 'km/h' },
    speedType: { enabled: true, required: false, description: 'Speed type classification' },
    nominalTractiveCapacity: { enabled: true, required: false, description: 'Nominal tractive capacity' },
    carCount: { enabled: true, required: false, description: 'Car count', min: 1 },
    destination: { enabled: true, required: false, description: 'Destination station' },
    direction: { enabled: true, required: true, description: 'Direction indicator' },
    workType: { enabled: true, required: false, description: 'Work type' },
    dayCount: { enabled: true, required: false, description: 'Day count', min: 0 },
    isRideOnMoving: { enabled: true, required: false, description: 'Allow ride-on while moving' },
    color: { enabled: true, required: false, description: 'Display color (hex)', format: '^[0-9a-fA-F]{6}$' },
    beginRemarks: { enabled: true, required: false, description: 'Begin remarks' },
    afterRemarks: { enabled: true, required: false, description: 'After remarks' },
    remarks: { enabled: true, required: false, description: 'General remarks' },
    trainInfo: { enabled: true, required: false, description: 'Train information' },
    beforeDeparture: { enabled: true, required: false, description: 'Before departure info' },
    afterArrive: { enabled: true, required: false, description: 'After arrival info' },
    nextTrainId: { enabled: true, required: false, description: 'Next train ID reference' },
    timetableRows: { enabled: true, required: true, description: 'Timetable rows', minItems: 0 },
  },
  work: {
    id: { enabled: true, required: false, description: 'Unique identifier for work' },
    name: { enabled: true, required: true, description: 'Work name' },
    affectDate: { enabled: true, required: false, description: 'Effective date', format: 'YYYYMMDD' },
    affixContentType: { enabled: true, required: false, description: 'Affix content type' },
    affixContent: { enabled: true, required: false, description: 'Affix content' },
    hasETrainTimetable: { enabled: true, required: false, description: 'Has e-train timetable' },
    eTrainTimetableContentType: { enabled: true, required: false, description: 'E-train timetable content type' },
    eTrainTimetableContent: { enabled: true, required: false, description: 'E-train timetable content' },
    remarks: { enabled: true, required: false, description: 'Remarks' },
    trains: { enabled: true, required: true, description: 'Trains list', minItems: 0 },
  },
  workGroup: {
    id: { enabled: true, required: false, description: 'Unique identifier for work group' },
    name: { enabled: true, required: true, description: 'Work group name' },
    dbVersion: { enabled: true, required: false, description: 'Database version', min: 0 },
    works: { enabled: true, required: true, description: 'Works list', minItems: 0 },
  },
});
