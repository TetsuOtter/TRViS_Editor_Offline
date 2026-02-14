/**
 * E2E Persistence Tests for TRViS Configuration
 *
 * Validates that all TRViS properties (Train, TimetableRow, Work, WorkGroup)
 * are correctly saved and retrieved from the data store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDataStore } from '../dataStore';
import { useProjectStore } from '../projectStore';
import { useEditorStore } from '../editorStore';
import { v4 as uuidv4 } from 'uuid';
import type { Train, TimetableRow, Work, WorkGroup } from '../../types/trvis';

describe('TRViS Configuration Persistence E2E Tests', () => {
  beforeEach(async () => {
    localStorage.clear();
    useDataStore.setState({ workGroups: [] });
    useEditorStore.setState({ stations: [], lines: [], trainTypePatterns: [] });
    await useProjectStore.getState().initialize();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('TimetableRow Property Persistence', () => {
    it('should persist all TimetableRow basic properties', () => {
      const testRow: TimetableRow = {
        Id: uuidv4(),
        StationName: 'Tokyo Station',
        FullName: 'Tokyo Central Station',
        Location_m: 0,
        TrackName: '5',
      };

      const workGroup = createTestWorkGroup();
      const work = createTestWork();
      const train = createTestTrain([testRow]);

      work.Trains.push(train);
      workGroup.Works.push(work);

      useDataStore.getState().addWorkGroup(workGroup);

      const savedTrain = useDataStore
        .getState()
        .getTrain(0, 0, 0);
      const savedRow = savedTrain?.TimetableRows[0];

      expect(savedRow).toBeDefined();
      expect(savedRow?.StationName).toBe('Tokyo Station');
      expect(savedRow?.FullName).toBe('Tokyo Central Station');
      expect(savedRow?.Location_m).toBe(0);
      expect(savedRow?.TrackName).toBe('5');
    });

    it('should persist all TimetableRow timing properties', () => {
      const testRow: TimetableRow = {
        Id: uuidv4(),
        StationName: 'Shinjuku',
        Location_m: 5000,
        Arrive: '10:30:00',
        Departure: '10:31:00',
        DriveTime_MM: 5,
        DriveTime_SS: 30,
      };

      const workGroup = createTestWorkGroup();
      const work = createTestWork();
      const train = createTestTrain([testRow]);

      work.Trains.push(train);
      workGroup.Works.push(work);
      useDataStore.getState().addWorkGroup(workGroup);

      const savedRow = useDataStore
        .getState()
        .getTrain(0, 0, 0)?.TimetableRows[0];

      expect(savedRow?.Arrive).toBe('10:30:00');
      expect(savedRow?.Departure).toBe('10:31:00');
      expect(savedRow?.DriveTime_MM).toBe(5);
      expect(savedRow?.DriveTime_SS).toBe(30);
    });

    it('should persist all TimetableRow advanced properties', () => {
      const testRow: TimetableRow = {
        Id: uuidv4(),
        StationName: 'Osaka',
        Location_m: 10000,
        Longitude_deg: 135.5023,
        Latitude_deg: 34.6937,
        OnStationDetectRadius_m: 500,
        IsPass: false,
        IsLastStop: false,
        IsOperationOnlyStop: false,
        HasBracket: false,
        RunInLimit: 100,
        RunOutLimit: 150,
        MarkerColor: 'FF0000',
        MarkerText: 'Stop',
        RecordType: 1,
        WorkType: 2,
        Remarks: 'Important station',
      };

      const workGroup = createTestWorkGroup();
      const work = createTestWork();
      const train = createTestTrain([testRow]);

      work.Trains.push(train);
      workGroup.Works.push(work);
      useDataStore.getState().addWorkGroup(workGroup);

      const savedRow = useDataStore
        .getState()
        .getTrain(0, 0, 0)?.TimetableRows[0];

      expect(savedRow?.Longitude_deg).toBe(135.5023);
      expect(savedRow?.Latitude_deg).toBe(34.6937);
      expect(savedRow?.OnStationDetectRadius_m).toBe(500);
      expect(savedRow?.IsPass).toBe(false);
      expect(savedRow?.IsLastStop).toBe(false);
      expect(savedRow?.IsOperationOnlyStop).toBe(false);
      expect(savedRow?.HasBracket).toBe(false);
      expect(savedRow?.RunInLimit).toBe(100);
      expect(savedRow?.RunOutLimit).toBe(150);
      expect(savedRow?.MarkerColor).toBe('FF0000');
      expect(savedRow?.MarkerText).toBe('Stop');
      expect(savedRow?.RecordType).toBe(1);
      expect(savedRow?.WorkType).toBe(2);
      expect(savedRow?.Remarks).toBe('Important station');
    });

    it('should update TimetableRow properties correctly', () => {
      const testRow: TimetableRow = {
        Id: uuidv4(),
        StationName: 'Original',
        Location_m: 0,
      };

      const workGroup = createTestWorkGroup();
      const work = createTestWork();
      const train = createTestTrain([testRow]);

      work.Trains.push(train);
      workGroup.Works.push(work);
      useDataStore.getState().addWorkGroup(workGroup);

      // Update the row
      const updatedRow: TimetableRow = {
        ...testRow,
        StationName: 'Updated',
        FullName: 'Updated Station',
        Arrive: '12:00:00',
        IsPass: true,
      };

      useDataStore
        .getState()
        .updateTimetableRow(0, 0, 0, 0, updatedRow);

      const savedRow = useDataStore
        .getState()
        .getTrain(0, 0, 0)?.TimetableRows[0];

      expect(savedRow?.StationName).toBe('Updated');
      expect(savedRow?.FullName).toBe('Updated Station');
      expect(savedRow?.Arrive).toBe('12:00:00');
      expect(savedRow?.IsPass).toBe(true);
    });
  });

  describe('Train Property Persistence', () => {
    it('should persist all Train basic properties', () => {
      const testTrain: Train = {
        Id: uuidv4(),
        TrainNumber: 'Express 100',
        Direction: 1,
        MaxSpeed: '120',
        CarCount: 10,
        Destination: 'Osaka',
        TimetableRows: [],
      };

      const workGroup = createTestWorkGroup();
      const work = createTestWork();

      work.Trains.push(testTrain);
      workGroup.Works.push(work);
      useDataStore.getState().addWorkGroup(workGroup);

      const savedTrain = useDataStore
        .getState()
        .getTrain(0, 0, 0);

      expect(savedTrain?.TrainNumber).toBe('Express 100');
      expect(savedTrain?.Direction).toBe(1);
      expect(savedTrain?.MaxSpeed).toBe('120');
      expect(savedTrain?.CarCount).toBe(10);
      expect(savedTrain?.Destination).toBe('Osaka');
    });

    it('should persist all Train advanced properties', () => {
      const testTrain: Train = {
        Id: uuidv4(),
        TrainNumber: 'Local 50',
        Direction: -1,
        MaxSpeed: '100',
        SpeedType: 'Local',
        NominalTractiveCapacity: 'High',
        CarCount: 8,
        Destination: 'Kyoto',
        WorkType: 1,
        DayCount: 1,
        IsRideOnMoving: true,
        Color: '0000FF',
        BeginRemarks: 'Begin remarks',
        AfterRemarks: 'After remarks',
        Remarks: 'General remarks',
        TrainInfo: 'Train info',
        BeforeDeparture: 'Before departure',
        AfterArrive: 'After arrival',
        NextTrainId: 'next-train-123',
        TimetableRows: [],
      };

      const workGroup = createTestWorkGroup();
      const work = createTestWork();

      work.Trains.push(testTrain);
      workGroup.Works.push(work);
      useDataStore.getState().addWorkGroup(workGroup);

      const savedTrain = useDataStore
        .getState()
        .getTrain(0, 0, 0);

      expect(savedTrain?.SpeedType).toBe('Local');
      expect(savedTrain?.NominalTractiveCapacity).toBe('High');
      expect(savedTrain?.WorkType).toBe(1);
      expect(savedTrain?.DayCount).toBe(1);
      expect(savedTrain?.IsRideOnMoving).toBe(true);
      expect(savedTrain?.Color).toBe('0000FF');
      expect(savedTrain?.BeginRemarks).toBe('Begin remarks');
      expect(savedTrain?.AfterRemarks).toBe('After remarks');
      expect(savedTrain?.Remarks).toBe('General remarks');
      expect(savedTrain?.TrainInfo).toBe('Train info');
      expect(savedTrain?.BeforeDeparture).toBe('Before departure');
      expect(savedTrain?.AfterArrive).toBe('After arrival');
      expect(savedTrain?.NextTrainId).toBe('next-train-123');
    });

    it('should update Train properties correctly', () => {
      const testTrain: Train = {
        Id: uuidv4(),
        TrainNumber: 'Original',
        Direction: 1,
        TimetableRows: [],
      };

      const workGroup = createTestWorkGroup();
      const work = createTestWork();

      work.Trains.push(testTrain);
      workGroup.Works.push(work);
      useDataStore.getState().addWorkGroup(workGroup);

      // Update the train
      const updatedTrain: Train = {
        ...testTrain,
        TrainNumber: 'Updated Express',
        MaxSpeed: '150',
        CarCount: 12,
        Color: 'FF00FF',
      };

      useDataStore.getState().updateTrain(0, 0, 0, updatedTrain);

      const savedTrain = useDataStore
        .getState()
        .getTrain(0, 0, 0);

      expect(savedTrain?.TrainNumber).toBe('Updated Express');
      expect(savedTrain?.MaxSpeed).toBe('150');
      expect(savedTrain?.CarCount).toBe(12);
      expect(savedTrain?.Color).toBe('FF00FF');
    });
  });

  describe('Work Property Persistence', () => {
    it('should persist all Work basic properties', () => {
      const testWork: Work = {
        Id: uuidv4(),
        Name: 'Weekday Schedule',
        AffectDate: '20240101',
        Remarks: 'Applies on weekdays',
        Trains: [],
      };

      const workGroup = createTestWorkGroup();

      workGroup.Works.push(testWork);
      useDataStore.getState().addWorkGroup(workGroup);

      const savedWork = useDataStore
        .getState()
        .getWork(0, 0);

      expect(savedWork?.Name).toBe('Weekday Schedule');
      expect(savedWork?.AffectDate).toBe('20240101');
      expect(savedWork?.Remarks).toBe('Applies on weekdays');
    });

    it('should persist all Work advanced properties', () => {
      const testWork: Work = {
        Id: uuidv4(),
        Name: 'Special Schedule',
        AffectDate: '20240101',
        AffixContentType: 1,
        AffixContent: 'Special content',
        HasETrainTimetable: true,
        ETrainTimetableContentType: 2,
        ETrainTimetableContent: 'E-Train content',
        Remarks: 'Special remarks',
        Trains: [],
      };

      const workGroup = createTestWorkGroup();

      workGroup.Works.push(testWork);
      useDataStore.getState().addWorkGroup(workGroup);

      const savedWork = useDataStore
        .getState()
        .getWork(0, 0);

      expect(savedWork?.AffixContentType).toBe(1);
      expect(savedWork?.AffixContent).toBe('Special content');
      expect(savedWork?.HasETrainTimetable).toBe(true);
      expect(savedWork?.ETrainTimetableContentType).toBe(2);
      expect(savedWork?.ETrainTimetableContent).toBe('E-Train content');
    });

    it('should update Work properties correctly', () => {
      const testWork: Work = {
        Id: uuidv4(),
        Name: 'Original Work',
        AffectDate: '20240101',
        Trains: [],
      };

      const workGroup = createTestWorkGroup();

      workGroup.Works.push(testWork);
      useDataStore.getState().addWorkGroup(workGroup);

      // Update the work
      const updatedWork: Work = {
        ...testWork,
        Name: 'Updated Work',
        AffectDate: '20240102',
        Remarks: 'Updated remarks',
      };

      useDataStore.getState().updateWork(0, 0, updatedWork);

      const savedWork = useDataStore
        .getState()
        .getWork(0, 0);

      expect(savedWork?.Name).toBe('Updated Work');
      expect(savedWork?.AffectDate).toBe('20240102');
      expect(savedWork?.Remarks).toBe('Updated remarks');
    });
  });

  describe('WorkGroup Property Persistence', () => {
    it('should persist all WorkGroup basic properties', () => {
      const testWorkGroup: WorkGroup = {
        Id: uuidv4(),
        Name: 'Yamanote Line',
        DBVersion: 1,
        Works: [],
      };

      useDataStore.getState().addWorkGroup(testWorkGroup);

      const savedWG = useDataStore
        .getState()
        .workGroups[0];

      expect(savedWG?.Name).toBe('Yamanote Line');
      expect(savedWG?.DBVersion).toBe(1);
    });

    it('should support optional WorkGroup properties', () => {
      const testWorkGroup: WorkGroup = {
        Id: uuidv4(),
        Name: 'Chuo Line',
        Works: [],
      };

      useDataStore.getState().addWorkGroup(testWorkGroup);

      const savedWG = useDataStore
        .getState()
        .workGroups[0];

      expect(savedWG?.Name).toBe('Chuo Line');
      expect(savedWG?.DBVersion).toBeUndefined();
    });
  });

  describe('Complex Multi-Level Property Persistence', () => {
    it('should persist complete WorkGroup->Work->Train->TimetableRow hierarchy', () => {
      const workGroup: WorkGroup = {
        Id: uuidv4(),
        Name: 'Tokaido Line',
        DBVersion: 2,
        Works: [
          {
            Id: uuidv4(),
            Name: 'Morning Rush',
            AffectDate: '20240115',
            Remarks: 'Morning schedule',
            Trains: [
              {
                Id: uuidv4(),
                TrainNumber: 'Kodama 501',
                Direction: 1,
                MaxSpeed: '320',
                CarCount: 16,
                Destination: 'Nagoya',
                SpeedType: 'Shinkansen',
                IsRideOnMoving: false,
                Color: '0066CC',
                TimetableRows: [
                  {
                    Id: uuidv4(),
                    StationName: 'Tokyo',
                    FullName: 'Tokyo Station',
                    Location_m: 0,
                    Departure: '07:00:00',
                    TrackName: '1',
                    IsPass: false,
                  },
                  {
                    Id: uuidv4(),
                    StationName: 'Yokohama',
                    FullName: 'Yokohama Station',
                    Location_m: 28600,
                    Arrive: '07:15:00',
                    Departure: '07:16:00',
                    TrackName: '2',
                    IsPass: false,
                  },
                  {
                    Id: uuidv4(),
                    StationName: 'Nagoya',
                    FullName: 'Nagoya Station',
                    Location_m: 366400,
                    Arrive: '08:15:00',
                    TrackName: '3',
                    IsPass: false,
                    IsLastStop: true,
                  },
                ],
              },
            ],
          },
        ],
      };

      useDataStore.getState().addWorkGroup(workGroup);

      // Verify complete hierarchy
      const savedWG = useDataStore.getState().workGroups[0];
      expect(savedWG?.Name).toBe('Tokaido Line');
      expect(savedWG?.DBVersion).toBe(2);

      const savedWork = savedWG?.Works[0];
      expect(savedWork?.Name).toBe('Morning Rush');
      expect(savedWork?.AffectDate).toBe('20240115');

      const savedTrain = savedWork?.Trains[0];
      expect(savedTrain?.TrainNumber).toBe('Kodama 501');
      expect(savedTrain?.MaxSpeed).toBe('320');
      expect(savedTrain?.TimetableRows).toHaveLength(3);

      const row1 = savedTrain?.TimetableRows[0];
      expect(row1?.StationName).toBe('Tokyo');
      expect(row1?.Location_m).toBe(0);

      const row2 = savedTrain?.TimetableRows[1];
      expect(row2?.Arrive).toBe('07:15:00');

      const row3 = savedTrain?.TimetableRows[2];
      expect(row3?.IsLastStop).toBe(true);
    });
  });

  describe('Data Persistence and Retrieval Consistency', () => {
    it('should maintain data consistency across multiple updates', () => {
      const workGroup = createTestWorkGroup();
      const work = createTestWork();
      const train = createTestTrain([]);

      // Add initial data
      work.Trains.push(train);
      workGroup.Works.push(work);
      useDataStore.getState().addWorkGroup(workGroup);

      // Add and update multiple rows
      const rows: TimetableRow[] = [
        {
          Id: uuidv4(),
          StationName: 'Station A',
          Location_m: 0,
        },
        {
          Id: uuidv4(),
          StationName: 'Station B',
          Location_m: 5000,
        },
      ];

      rows.forEach((row) => {
        useDataStore
          .getState()
          .addTimetableRow(0, 0, 0, row);
      });

      // Update first row
      const updatedRow = {
        ...rows[0],
        Departure: '10:00:00',
        IsPass: true,
      };

      useDataStore
        .getState()
        .updateTimetableRow(0, 0, 0, 0, updatedRow);

      // Verify all data
      const savedTrain = useDataStore
        .getState()
        .getTrain(0, 0, 0);

      expect(savedTrain?.TimetableRows).toHaveLength(2);
      expect(savedTrain?.TimetableRows[0].StationName).toBe('Station A');
      expect(savedTrain?.TimetableRows[0].Departure).toBe('10:00:00');
      expect(savedTrain?.TimetableRows[0].IsPass).toBe(true);
      expect(savedTrain?.TimetableRows[1].StationName).toBe('Station B');
      expect(savedTrain?.TimetableRows[1].Departure).toBeUndefined();
    });
  });
});

// Helper functions
function createTestWorkGroup(): WorkGroup {
  return {
    Id: uuidv4(),
    Name: 'Test WorkGroup',
    Works: [],
  };
}

function createTestWork(): Work {
  return {
    Id: uuidv4(),
    Name: 'Test Work',
    AffectDate: '20240101',
    Trains: [],
  };
}

function createTestTrain(rows: TimetableRow[]): Train {
  return {
    Id: uuidv4(),
    TrainNumber: 'Test Train',
    Direction: 1,
    TimetableRows: rows,
  };
}
