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
  Arrive?: string;
  Departure?: string;
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
  StationType?: number;
  StationIndex?: number;
  LineColor?: string;
  StopSecond?: number;
  DisplayArrival?: string;
  DisplayDeparture?: string;
  AllowMultipleMen?: boolean;
  NeedStaffChanging?: boolean;
}

export interface Train {
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
  TrainInfo2?: string;
  TrainLength?: number;
  TrainMass?: number;
  MaxAc?: number;
  TrainType?: number;
  ETrainTimetableContentType?: number;
  ETrainTimetableContent?: string;
  TimetableRows: TimetableRow[];
}

export interface Work {
  Id?: string;
  Name: string;
  AffectDate?: string;
  AffixContentType?: number;
  AffixContent?: string;
  Remarks?: string;
  HasETrainTimetable?: boolean;
  ETrainTimetableContentType?: number;
  ETrainTimetableContent?: string;
  Description?: string;
  WorkGroup?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  IsActive?: boolean;
  DisplayOrder?: number;
  Trains: Train[];
  [key: string]: unknown;
}

export interface WorkGroup {
  Id?: string;
  Name: string;
  DBVersion?: number;
  Description?: string;
  RailwayName?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  IsActive?: boolean;
  DisplayOrder?: number;
  Works: Work[];
}

export type Database = WorkGroup[];

export interface TRViSData {
  railway: {
    name: string;
    stations: Array<{
      name: string;
      fullName?: string;
      longitude?: number;
      latitude?: number;
    }>;
  };
  workGroups: WorkGroup[];
}
