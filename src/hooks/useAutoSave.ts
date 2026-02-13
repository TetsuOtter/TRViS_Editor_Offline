import { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';

/**
 * Hook that automatically saves data to the active project
 * when workGroups or metadata changes
 */
export function useAutoSave(enabled: boolean = true) {
  const workGroups = useDataStore((state) => state.workGroups);
  const metadata = useEditorStore((state) => ({
    stations: state.stations,
    lines: state.lines,
    trainTypePatterns: state.trainTypePatterns,
  }));
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  useEffect(() => {
    if (!enabled || !activeProjectId) return;

    // Small delay to batch updates
    const timer = setTimeout(() => {
      useDataStore.getState().saveToProject(activeProjectId);
    }, 500);

    return () => clearTimeout(timer);
  }, [workGroups, metadata, activeProjectId, enabled]);
}
