import { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';

/**
 * Hook that automatically saves data to the active project
 * when workGroups or metadata changes
 * Integrates with repository layer for backend-ready persistence
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

    // Batch updates with small delay
    const timer = setTimeout(async () => {
      try {
        // Save both data and metadata
        await useDataStore.getState().saveToProject(activeProjectId);
        await useEditorStore.getState().saveToProject(activeProjectId);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [workGroups, metadata, activeProjectId, enabled]);
}
