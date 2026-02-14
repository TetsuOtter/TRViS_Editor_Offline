import type { Station, Line, TrainTypePattern } from '../types/editor'
import type { Project } from '../types/storage'
import type { TRViSData, WorkGroup, Work, Train, TimetableRow } from '../types/trvis'

// Sample stations
export const mockStations: Station[] = [
  {
    id: 'st-1',
    name: '東京',
    fullName: '東京駅',
    longitude: 139.7673,
    latitude: 35.6812,
  },
  {
    id: 'st-2',
    name: '品川',
    fullName: '品川駅',
    longitude: 139.7403,
    latitude: 35.6285,
  },
  {
    id: 'st-3',
    name: '新橋',
    fullName: '新橋駅',
    longitude: 139.7585,
    latitude: 35.6658,
  },
]

// Sample line
export const mockLine: Line = {
  id: 'line-1',
  name: 'JR東海道線',
  stations: [
    { stationId: 'st-1', distanceFromStart_m: 0 },
    { stationId: 'st-3', distanceFromStart_m: 2800 },
    { stationId: 'st-2', distanceFromStart_m: 6800 },
  ],
}

// Sample train type pattern
export const mockTrainTypePattern: TrainTypePattern = {
  id: 'pattern-1',
  lineId: 'line-1',
  typeName: '普通列車パターン',
  intervals: [
    { fromStationId: 'st-1', toStationId: 'st-3', driveTime_MM: 3, driveTime_SS: 0 }, // 3分
    { fromStationId: 'st-3', toStationId: 'st-2', driveTime_MM: 4, driveTime_SS: 0 }, // 4分
  ],
}

// Sample project
export const mockProject: Project = {
  projectId: 'proj-1',
  name: 'テストプロジェクト',
  database: [],
  metadata: {
    stations: [],
    lines: [],
    trainTypePatterns: [],
  },
  createdAt: Date.now(),
  lastModified: Date.now(),
}

// Sample work group
export const mockWorkGroup: WorkGroup = {
  Id: 'wg-1',
  Name: '平日ダイヤ',
  Works: [],
}

// Sample work
export const mockWork: Work = {
  Id: 'work-1',
  Name: '平日運行',
  AffectDate: '20260213',
  Trains: [],
}

// Sample train
export const mockTrain: Train = {
  TrainNumber: '001',
  MaxSpeed: 120,
  CarCount: 10,
  Destination: '品川',
  Direction: 1 as 1 | -1,
  TimetableRows: [],
}

// Sample timetable rows
export const mockTimetableRows: TimetableRow[] = [
  {
    StationName: '東京',
    Location_m: 0,
    Arrive: null,
    Departure: '06:00:00',
    TrackName: '1',
  },
  {
    StationName: '品川',
    Location_m: 5000,
    Arrive: '06:05:00',
    Departure: '06:06:00',
    TrackName: '1',
  },
  {
    StationName: '新横浜',
    Location_m: 25000,
    Arrive: '06:20:00',
    Departure: null,
    TrackName: '2',
  },
]

// Complete TRViS data for import/export tests
export const mockTRViSData: TRViSData = {
  railway: {
    name: 'テスト鉄道',
    stations: mockStations.map(station => ({
      name: station.name,
      fullName: station.fullName,
      longitude: station.longitude,
      latitude: station.latitude,
    })),
  },
  workGroups: [
    {
      Name: mockWorkGroup.Name,
      Works: [
        {
          AffectDate: mockWork.AffectDate,
          Name: mockWork.Name,
          Trains: [
            {
              TrainNumber: mockTrain.TrainNumber,
              MaxSpeed: mockTrain.MaxSpeed,
              CarCount: mockTrain.CarCount,
              Destination: mockTrain.Destination,
              Direction: mockTrain.Direction,
              TimetableRows: mockTimetableRows,
            },
          ],
        },
      ],
    },
  ],
}

// Helper to create minimal valid project data
export const createTestProject = (overrides: Partial<Project> = {}): Project => ({
  ...mockProject,
  ...overrides,
})

// Helper to create test station
export const createTestStation = (overrides: Partial<Station> = {}): Station => ({
  ...mockStations[0],
  ...overrides,
})

// Helper to create test train
export const createTestTrain = (overrides: Partial<Train> = {}): Train => ({
  ...mockTrain,
  ...overrides,
})