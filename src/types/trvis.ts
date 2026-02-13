/**
 * TRViS JSON Schema types
 * Reference: https://github.com/TetsuOtter/TRViS.JsonModels/tree/main/schema
 */

export interface TimetableRow {
  Id?: string;
  StationName: string;
  FullName?: string;
  Location_m: number;
  Longitude_deg?: number;
  Latitude_deg?: number;
  OnStationDetectRadius_m?: number;
  DriveTime_MM?: number;
  DriveTime_SS?: number;
  Arrive?: string | null;
  Departure?: string | null;
  TrackName?: string;
  IsOperationOnlyStop?: boolean;
  IsPass?: boolean;
  HasBracket?: boolean;
  IsLastStop?: boolean;
  RunInLimit?: number;
  RunOutLimit?: number;
  RecordType?: number;
  WorkType?: number;
  Remarks?: string;
  MarkerColor?: string;
  MarkerText?: string;
}

export interface Train {
  Id?: string;
  TrainNumber: string;
  MaxSpeed?: number;
  SpeedType?: string | number;
  NominalTractiveCapacity?: string | number;
  CarCount?: number;
  Destination?: string;
  Direction: 1 | -1;
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
  TimetableRows: TimetableRow[];
}

export interface Work {
  Id?: string;
  Name: string;
  AffectDate: string;
  AffixContentType?: number;
  AffixContent?: string;
  Remarks?: string;
  HasETrainTimetable?: boolean;
  ETrainTimetableContentType?: number;
  ETrainTimetableContent?: string;
  Trains: Train[];
  [key: string]: unknown;
}

export interface WorkGroup {
  Id?: string;
  Name: string;
  DBVersion?: number;
  Works: Work[];
}

export type Database = WorkGroup[];
