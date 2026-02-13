import { create } from 'zustand';
import type { Work, Train, TimetableRow, WorkGroup } from '../types/trvis';
import { useProjectStore } from './projectStore';

interface DataState {
  workGroups: WorkGroup[];

  // WorkGroup actions
  setWorkGroups: (workGroups: WorkGroup[]) => void;
  addWorkGroup: (workGroup: WorkGroup) => void;
  updateWorkGroup: (index: number, workGroup: WorkGroup) => void;
  deleteWorkGroup: (index: number) => void;

  // Work actions
  addWork: (workGroupIndex: number, work: Work) => void;
  updateWork: (workGroupIndex: number, workIndex: number, work: Work) => void;
  deleteWork: (workGroupIndex: number, workIndex: number) => void;
  getWork: (workGroupIndex: number, workIndex: number) => Work | null;

  // Train actions
  addTrain: (workGroupIndex: number, workIndex: number, train: Train) => void;
  updateTrain: (workGroupIndex: number, workIndex: number, trainIndex: number, train: Train) => void;
  deleteTrain: (workGroupIndex: number, workIndex: number, trainIndex: number) => void;
  getTrain: (workGroupIndex: number, workIndex: number, trainIndex: number) => Train | null;
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
    row: TimetableRow
  ) => void;
  updateTimetableRow: (
    workGroupIndex: number,
    workIndex: number,
    trainIndex: number,
    rowIndex: number,
    row: TimetableRow
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

export const useDataStore = create<DataState>((set, get) => ({
  workGroups: [],

  setWorkGroups: (workGroups) => {
    set({ workGroups });
  },

  addWorkGroup: (workGroup) => {
    set((state) => ({
      workGroups: [...state.workGroups, workGroup],
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
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]) {
        newWorkGroups[workGroupIndex].Works.push(work);
      }
      return { workGroups: newWorkGroups };
    });
  },

  updateWork: (workGroupIndex, workIndex, work) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex] = work;
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
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains.push(train);
      }
      return { workGroups: newWorkGroups };
    });
  },

  updateTrain: (workGroupIndex, workIndex, trainIndex, train) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex] = train;
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

    const clonedTrain: Train = {
      ...train,
      Id: crypto.randomUUID(),
      TrainNumber: newTrainNumber,
    };

    get().addTrain(workGroupIndex, workIndex, clonedTrain);
  },

  addTimetableRow: (workGroupIndex, workIndex, trainIndex, row) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (newWorkGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex]) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex].TimetableRows.push(row);
      }
      return { workGroups: newWorkGroups };
    });
  },

  updateTimetableRow: (workGroupIndex, workIndex, trainIndex, rowIndex, row) => {
    set((state) => {
      const newWorkGroups = [...state.workGroups];
      if (
        newWorkGroups[workGroupIndex]?.Works[workIndex]?.Trains[trainIndex]
          ?.TimetableRows[rowIndex]
      ) {
        newWorkGroups[workGroupIndex].Works[workIndex].Trains[trainIndex].TimetableRows[
          rowIndex
        ] = row;
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
      set({ workGroups: projectData.database });
    }
  },

  saveToProject: (projectId) => {
    const { workGroups } = get();
    useProjectStore.getState().updateProjectData(projectId, workGroups);
  },
}));
