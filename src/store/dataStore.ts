import { create } from 'zustand';
import type { TimetableRowWithSettings, WorkWithSettings, TrainWithSettings, WorkGroupWithSettings } from '../types/storage';
import type { TimetableRow, Work, Train, WorkGroup, Database } from '../types/trvis';
import { useProjectStore } from './projectStore';
import { v4 as uuidv4 } from 'uuid';
import { convertToEditorDatabase } from '../utils/jsonIO';

interface DataState {
  workGroups: WorkGroupWithSettings[];

  // WorkGroup actions
  setWorkGroups: (workGroups: WorkGroupWithSettings[]) => void;
  addWorkGroup: (workGroup: WorkGroup | WorkGroupWithSettings) => void;
  updateWorkGroup: (index: number, workGroup: WorkGroupWithSettings) => void;
  deleteWorkGroup: (index: number) => void;

  // Work actions
  addWork: (workGroupIndex: number, work: Work | WorkWithSettings) => void;
  updateWork: (workGroupIndex: number, workIndex: number, work: Work | WorkWithSettings) => void;
  deleteWork: (workGroupIndex: number, workIndex: number) => void;
  getWork: (workGroupIndex: number, workIndex: number) => WorkWithSettings | null;

  // Train actions
  addTrain: (workGroupIndex: number, workIndex: number, train: Train | TrainWithSettings) => void;
  updateTrain: (workGroupIndex: number, workIndex: number, trainIndex: number, train: Train | TrainWithSettings) => void;
  deleteTrain: (workGroupIndex: number, workIndex: number, trainIndex: number) => void;
  getTrain: (workGroupIndex: number, workIndex: number, trainIndex: number) => TrainWithSettings | null;
  cloneTrain: (
    workGroupIndex: number,
    workIndex: number,
    trainIndex: number,
    newTrainNumber: string
  ) => void;

  // TimetableRow actions
  addTimetableRow: (
    workGroupIndex: number,
    workIndex: number,
    trainIndex: number,
    row: TimetableRow | TimetableRowWithSettings
  ) => void;
  updateTimetableRow: (
    workGroupIndex: number,
    workIndex: number,
    trainIndex: number,
    rowIndex: number,
    row: TimetableRow | TimetableRowWithSettings
  ) => void;
  deleteTimetableRow: (
    workGroupIndex: number,
    workIndex: number,
    trainIndex: number,
    rowIndex: number
  ) => void;

  // Sync with ProjectStore
  syncWithProject: (projectId: string) => void;
  saveToProject: (projectId: string) => void;
}

// Helper to detect if a row is in editor format (has numeric times)
const isRowInEditorFormat = (row: any): boolean => {
  return typeof row.Arrive === 'number' || typeof row.Departure === 'number';
};

// Helper to check if any row in a train is in editor format
const isTrainInEditorFormat = (train: any): boolean => {
  return train.TimetableRows && train.TimetableRows.length > 0 && 
    train.TimetableRows.some((row: any) => isRowInEditorFormat(row));
};

// Helper to check if any train in a work is in editor format
const isWorkInEditorFormat = (work: any): boolean => {
  return work.Trains && work.Trains.length > 0 && 
    work.Trains.some((train: any) => isTrainInEditorFormat(train));
};

// Helper to check if any work in a workgroup is in editor format
const isWorkGroupInEditorFormat = (workGroup: any): boolean => {
  return workGroup.Works && workGroup.Works.length > 0 && 
    workGroup.Works.some((work: any) => isWorkInEditorFormat(work));
};

// Helper to ensure WorkGroup is in editor format
const ensureWorkGroupWithSettings = (workGroup: any): WorkGroupWithSettings => {
  // If it's already in editor format, return as-is
  if (isWorkGroupInEditorFormat(workGroup)) {
    return workGroup;
  }
  // Otherwise convert from JSON format - wrap it in an array for convertToEditorDatabase
  const database: Database = [workGroup];
  const converted = convertToEditorDatabase(database);
  return converted[0];
};

// Helper to ensure Work is in editor format
const ensureWorkWithSettings = (work: any): WorkWithSettings => {
  // If it's already in editor format, return as-is
  if (isWorkInEditorFormat(work)) {
    return work;
  }
  // Create a minimal workgroup for conversion
  const tempDatabase: Database = [{ Works: [work] } as any];
  const converted = convertToEditorDatabase(tempDatabase);
  return converted[0].Works[0];
};

// Helper to ensure Train is in editor format
const ensureTrainWithSettings = (train: any): TrainWithSettings => {
  // If it's already in editor format, return as-is
  if (isTrainInEditorFormat(train)) {
    return train;
  }
  // Create a minimal structure for conversion
  const tempDatabase: Database = [{ Works: [{ Trains: [train] }] } as any];
  const converted = convertToEditorDatabase(tempDatabase);
  return converted[0].Works[0].Trains[0];
};

// Helper to ensure TimetableRow is in editor format
const ensureTimetableRowWithSettings = (row: any): TimetableRowWithSettings => {
  // If Arrive/Departure are numbers, it's already in editor format
  if (isRowInEditorFormat(row)) {
    return row;
  }
  // Create a minimal structure for conversion
  const tempDatabase: Database = [{ Works: [{ Trains: [{ TimetableRows: [row] }] }] } as any];
  const converted = convertToEditorDatabase(tempDatabase);
  return converted[0].Works[0].Trains[0].TimetableRows[0];
};

export const useDataStore = create<DataState>((set, get) => ({
  workGroups: [],

  setWorkGroups: (workGroups) => {
    set({ workGroups });
  },

  addWorkGroup: (workGroup) => {
    const normalizedWorkGroup = ensureWorkGroupWithSettings(workGroup);
    set((state) => ({
      workGroups: [...state.workGroups, normalizedWorkGroup],
    }));
  },

  updateWorkGroup: (index, workGroup) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      newWorkGroups[index] = workGroup;
      return { workGroups: newWorkGroups };
    });
  },

  deleteWorkGroup: (index) => {
    set((state) => ({
      workGroups: state.workGroups.filter((_, i) => i !== index),
    }));
  },

  addWork: (workGroupIndex, work) => {
    const normalizedWork = ensureWorkWithSettings(work);
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]) {
        newWorkGroups[workGroupIndex].Works.push(normalizedWork);
      }
      return { workGroups: newWorkGroups };
    });
  },

  updateWork: (workGroupIndex, workIndex, work) => {
    const normalizedWork = ensureWorkWithSettings(work);
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex] = normalizedWork;
      }
      return { workGroups: newWorkGroups };
    });
  },

  deleteWork: (workGroupIndex, workIndex) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]) {
        newWorkGroups[workGroupIndex].Works = newWorkGroups[workGroupIndex].Works.filter(
          (_, i) => i !== workIndex
        );
      }
      return { workGroups: newWorkGroups };
    });
  },

  getWork: (workGroupIndex, workIndex) => {
    const { workGroups } = get();
    return workGroups[workGroupIndex]?.Works[workIndex] || null;
  },

  addTrain: (workGroupIndex, workIndex, train) => {
    const normalizedTrain = ensureTrainWithSettings(train);
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains.push(normalizedTrain);
      }
      return { workGroups: newWorkGroups };
    });
  },

  updateTrain: (workGroupIndex, workIndex, trainIndex, train) => {
    const normalizedTrain = ensureTrainWithSettings(train);
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex] = normalizedTrain;
      }
      return { workGroups: newWorkGroups };
    });
  },

  deleteTrain: (workGroupIndex, workIndex, trainIndex) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains = newWorkGroups[
          workGroupIndex
        ].Works[workIndex].Trains.filter((_, i) => i !== trainIndex);
      }
      return { workGroups: newWorkGroups };
    });
  },

  getTrain: (workGroupIndex, workIndex, trainIndex) => {
    const { workGroups } = get();
    return workGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex] || null;
  },

  cloneTrain: (workGroupIndex, workIndex, trainIndex, newTrainNumber) => {
    const train = get().getTrain(workGroupIndex, workIndex, trainIndex);
    if (!train) return;

    const clonedTrain: TrainWithSettings = {
      ...train,
      Id: uuidv4(),
      TrainNumber: newTrainNumber,
    };

    get().addTrain(workGroupIndex, workIndex, clonedTrain);
  },

  addTimetableRow: (workGroupIndex, workIndex, trainIndex, row) => {
    const normalizedRow = ensureTimetableRowWithSettings(row);
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex].TimetableRows.push(normalizedRow);
      }
      return { workGroups: newWorkGroups };
    });
  },

  updateTimetableRow: (workGroupIndex, workIndex, trainIndex, rowIndex, row) => {
    const normalizedRow = ensureTimetableRowWithSettings(row);
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (
        newWorkGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex]
          ?.TimetableRows[rowIndex]
      ) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex].TimetableRows[
          rowIndex
        ] = normalizedRow;
      }
      return { workGroups: newWorkGroups };
    });
  },

  deleteTimetableRow: (workGroupIndex, workIndex, trainIndex, rowIndex) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex].TimetableRows =
          newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex].TimetableRows.filter(
            (_, i) => i !== rowIndex
          );
      }
      return { workGroups: newWorkGroups };
    });
  },

  syncWithProject: (projectId) => {
    const projectData = useProjectStore.getState().getProjectData(projectId);
    if (projectData) {
      set({ workGroups: projectData.database || [] });
    }
  },

  saveToProject: async (projectId) => {
    const { workGroups } = get();
    try {
      await useProjectStore.getState().updateProjectData(projectId, workGroups);
    } catch (error) {
      console.error('Failed to save data to project:', error);
    }
  },
}));
