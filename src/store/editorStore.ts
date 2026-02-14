import { create } from 'zustand';
import type { Station, Line, TrainTypePattern, EditorMetadata } from '../types/editor';
import { useProjectStore } from './projectStore';

interface EditorState {
  stations: Station[];
  lines: Line[];
  trainTypePatterns: TrainTypePattern[];

  // Station actions
  addStation: (station: Station) => void;
  updateStation: (stationId: string, station: Station) => void;
  deleteStation: (stationId: string) => void;
  getStation: (stationId: string) => Station | null;

  // Line actions
  addLine: (line: Line) => void;
  updateLine: (lineId: string, line: Line) => void;
  deleteLine: (lineId: string) => void;
  getLine: (lineId: string) => Line | null;
  getLineStations: (lineId: string) => Station[];

  // TrainTypePattern actions
  addTrainTypePattern: (pattern: TrainTypePattern) => void;
  updateTrainTypePattern: (patternId: string, pattern: TrainTypePattern) => void;
  deleteTrainTypePattern: (patternId: string) => void;
  getTrainTypePattern: (patternId: string) => TrainTypePattern | null;
  getTrainTypePatternsForLine: (lineId: string) => TrainTypePattern[];

  // Metadata sync
  setMetadata: (metadata: EditorMetadata) => void;
  getMetadata: () => EditorMetadata;
  syncWithProject: (projectId: string) => void;
  saveToProject: (projectId: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  stations: [],
  lines: [],
  trainTypePatterns: [],

  addStation: (station) => {
    set((state) => ({
      stations: [...state.stations, station],
    }));
  },

  updateStation: (stationId, station) => {
    set((state) => ({
      stations: state.stations.map((s) => (s.id === stationId ? station : s)),
    }));
  },

  deleteStation: (stationId) => {
    set((state) => ({
      stations: state.stations.filter((s) => s.id !== stationId),
      lines: state.lines.map((line) => ({
        ...line,
        stations: line.stations.filter((ls) => ls.stationId !== stationId),
      })),
    }));
  },

  getStation: (stationId) => {
    const { stations } = get();
    return stations.find((s) => s.id === stationId) || null;
  },

  addLine: (line) => {
    set((state) => ({
      lines: [...state.lines, line],
    }));
  },

  updateLine: (lineId, line) => {
    set((state) => ({
      lines: state.lines.map((l) => (l.id === lineId ? line : l)),
    }));
  },

  deleteLine: (lineId) => {
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== lineId),
      trainTypePatterns: state.trainTypePatterns.filter((p) => p.lineId !== lineId),
    }));
  },

  getLine: (lineId) => {
    const { lines } = get();
    return lines.find((l) => l.id === lineId) || null;
  },

  getLineStations: (lineId) => {
    const { lines, stations } = get();
    const line = lines.find((l) => l.id === lineId);
    if (!line) return [];

    const stationMap = new Map(stations.map((s) => [s.id, s]));
    return line.stations.map((ls) => stationMap.get(ls.stationId)).filter(Boolean) as Station[];
  },

  addTrainTypePattern: (pattern) => {
    set((state) => ({
      trainTypePatterns: [...state.trainTypePatterns, pattern],
    }));
  },

  updateTrainTypePattern: (patternId, pattern) => {
    set((state) => ({
      trainTypePatterns: state.trainTypePatterns.map((p) => (p.id === patternId ? pattern : p)),
    }));
  },

  deleteTrainTypePattern: (patternId) => {
    set((state) => ({
      trainTypePatterns: state.trainTypePatterns.filter((p) => p.id !== patternId),
    }));
  },

  getTrainTypePattern: (patternId) => {
    const { trainTypePatterns } = get();
    return trainTypePatterns.find((p) => p.id === patternId) || null;
  },

  getTrainTypePatternsForLine: (lineId) => {
    const { trainTypePatterns } = get();
    return trainTypePatterns.filter((p) => p.lineId === lineId);
  },

  setMetadata: (metadata) => {
    set({
      stations: metadata.stations,
      lines: metadata.lines,
      trainTypePatterns: metadata.trainTypePatterns,
    });
  },

  getMetadata: () => {
    const { stations, lines, trainTypePatterns } = get();
    return {
      stations,
      lines,
      trainTypePatterns,
    };
  },

  syncWithProject: (projectId) => {
    const projectData = useProjectStore.getState().getProjectData(projectId);
    if (projectData) {
      get().setMetadata(projectData.metadata);
    }
  },

  saveToProject: async (projectId) => {
    try {
      const metadata = get().getMetadata();
      await useProjectStore.getState().updateProjectMetadata(projectId, metadata);
    } catch (error) {
      console.error('Failed to save metadata to project:', error);
    }
  },
}));
