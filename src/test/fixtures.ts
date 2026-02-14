import { Project, WorkGroup, Work, Train, TimetableRow } from '../types/storage'
import type { Station, Line, TrainTypePattern } from '../types/editor'
import { TRViSData } from '../types/trvis'

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
  id: 'proj-1',
  name: 'テストプロジェクト',
  description: 'E2Eテスト用のサンプルプロジェクト',
  createdAt: '2026-02-13T00:00:00.000Z',
  updatedAt: '2026-02-13T00:00:00.000Z',
}

// Sample work group
export const mockWorkGroup: WorkGroup = {
  id: 'wg-1',
  name: '平日ダイヤ',
  description: '平日運行ダイヤ',
  projectId: 'proj-1',
}

// Sample work
export const mockWork: Work = {
  id: 'work-1',
  workGroupId: 'wg-1',
  affectDate: '20260213',
  name: '平日運行',
  remarks: '',
}

// Sample train
export const mockTrain: Train = {
  id: 'train-1',
  workId: 'work-1',
  trainNumber: '001',
  maxSpeed: 120,
  carCount: 10,
  destination: '品川',
  direction: 1,
  workType: '',
}

// Sample timetable rows
export const mockTimetableRows: TimetableRow[] = [
  {
    id: 'row-1',
    trainId: 'train-1',
    stationId: 'st-1',
    arrivalTime: '',
    departureTime: '06:00:00',
    track: '1',
    stopType: 0,
  },
  {
    id: 'row-2',
    trainId: 'train-1',
    stationId: 'st-3',
    arrivalTime: '06:03:00',
    departureTime: '06:03:30',
    track: '1',
    stopType: 0,
  },
  {
    id: 'row-3',
    trainId: 'train-1',
    stationId: 'st-2',
    arrivalTime: '06:07:30',
    departureTime: '',
    track: '2',
    stopType: 0,
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
      name: mockWorkGroup.name,
      description: mockWorkGroup.description,
      works: [
        {
          affectDate: mockWork.affectDate,
          name: mockWork.name,
          remarks: mockWork.remarks,
          trains: [
            {
              trainNumber: mockTrain.trainNumber,
              maxSpeed: mockTrain.maxSpeed,
              carCount: mockTrain.carCount,
              destination: mockTrain.destination,
              direction: mockTrain.direction,
              workType: mockTrain.workType,
              timetableRows: mockTimetableRows.map(row => ({
                stationName: mockStations.find(s => s.id === row.stationId)?.name || '',
                arrivalTime: row.arrivalTime,
                departureTime: row.departureTime,
                track: row.track,
                stopType: row.stopType,
              })),
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