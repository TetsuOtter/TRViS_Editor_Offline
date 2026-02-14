# Data Repository Layer - Quick Reference

## For Developers

### Using the Repository in Components

```typescript
import { useProjectStore } from './store/projectStore';
import { useDataStore } from './store/dataStore';
import { useEditorStore } from './store/editorStore';

export function MyComponent() {
  const { createProject, projects } = useProjectStore();
  const { saveToProject, workGroups } = useDataStore();

  const handleCreateProject = async (name: string) => {
    try {
      const projectId = await createProject(name);
      console.log('Project created:', projectId);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleSaveData = async (projectId: string) => {
    try {
      await saveToProject(projectId);
      console.log('Data saved');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  return (
    <div>
      {/* Your JSX here */}
    </div>
  );
}
```

### Handling Async Operations

```typescript
// ✅ Good: Always handle promises
const projectId = await useProjectStore.getState().createProject(name);

// ✅ Good: Use try-catch
try {
  await repository.createProject(data);
} catch (error) {
  console.error('Error:', error);
}

// ❌ Bad: Ignore promise
useProjectStore.getState().createProject(name); // Warning: unhandled promise
```

### Error Handling Pattern

```typescript
const result = await repository.createProject(data);

if (result.success) {
  // result.data contains the ProjectData
  updateUI(result.data);
} else {
  // result.error contains error message
  showErrorDialog(result.error);
}
```

### Working with Multiple Projects

```typescript
// Get all projects
const projects = useProjectStore((state) => state.projects);

// Switch active project
await useProjectStore.getState().setActiveProject(projectId);

// Get active project data
const activeData = useProjectStore((state) =>
  state.getActiveProjectData()
);

// Get specific project
const projectData = useProjectStore((state) =>
  state.getProjectData(projectId)
);
```

### Saving Data

```typescript
// Save timetable data
await useDataStore.getState().saveToProject(projectId);

// Save metadata (stations, lines, patterns)
await useEditorStore.getState().saveToProject(projectId);

// Both are called automatically by useAutoSave hook
// But you can call them explicitly when needed
```

### Syncing Data

```typescript
// Reload all data from repository
await useProjectStore.getState().reloadFromRepository();

// Sync to repository
await useProjectStore.getState().syncToRepository();

// Get sync status
const status = repository.getSyncStatus();
console.log(`Synced: ${status.isSynced}`);
console.log(`Pending: ${status.pendingChanges}`);
```

## For Testing

### Basic Setup

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useProjectStore } from '../projectStore';

describe('My Feature', () => {
  beforeEach(async () => {
    localStorage.clear();
    await useProjectStore.getState().initialize();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should work', async () => {
    const projectId = await useProjectStore.getState().createProject('Test');
    expect(projectId).toBeDefined();
  });
});
```

### Testing with Multiple Stores

```typescript
it('should sync data across stores', async () => {
  // Create project
  const projectId = await useProjectStore
    .getState()
    .createProject('Test Project');

  // Add data to DataStore
  useDataStore.getState().syncWithProject(projectId);
  useDataStore.getState().addWorkGroup({ Name: 'Schedule', Works: [] });

  // Save through repository
  await useDataStore.getState().saveToProject(projectId);

  // Verify persistence
  const projectData = useProjectStore
    .getState()
    .getProjectData(projectId);

  expect(projectData?.database.workGroups).toHaveLength(1);
});
```

## Common Patterns

### Pattern: Create and Edit Workflow

```typescript
async function createAndEditProject(name: string) {
  // 1. Create project
  const projectId = await useProjectStore
    .getState()
    .createProject(name);

  // 2. Load for editing
  useDataStore.getState().syncWithProject(projectId);
  useEditorStore.getState().syncWithProject(projectId);

  // 3. User makes changes...
  // (automatically saved by useAutoSave hook)

  // 4. Verify saved
  const saved = useProjectStore
    .getState()
    .getProjectData(projectId);
  return saved;
}
```

### Pattern: Bulk Import

```typescript
async function importProjects(projects: ProjectData[]) {
  for (const project of projects) {
    const result = await repository.createProject(project);
    if (!result.success) {
      console.error(`Failed to import ${project.name}:`, result.error);
    }
  }
}
```

### Pattern: Export and Download

```typescript
async function exportProject(projectId: string) {
  const projectData = useProjectStore
    .getState()
    .getProjectData(projectId);

  const json = JSON.stringify(projectData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectData.name}.json`;
  a.click();
}
```

### Pattern: Reload on Network Recovery

```typescript
import { useEffect } from 'react';

export function useNetworkRecovery() {
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Network recovered, reloading data...');
      try {
        await useProjectStore.getState().reloadFromRepository();
        console.log('Data reloaded');
      } catch (error) {
        console.error('Failed to reload after network recovery:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}
```

## Type Reference

### ProjectData
```typescript
interface ProjectData {
  id: string;                    // UUID
  name: string;
  createdAt: number;             // Unix timestamp
  lastModified: number;          // Unix timestamp
  database: Database;            // TRViS workgroups
  metadata: EditorMetadata;      // Stations, lines, patterns
}
```

### StorageState
```typescript
interface StorageState {
  projectData: ProjectData[];
  activeProjectId: string | null;
}
```

### SyncStatus
```typescript
interface SyncStatus {
  isSynced: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  syncError?: string;
}
```

### Result Type
```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## API Reference

### ProjectStore Methods

```typescript
// Initialization
initialize(): Promise<void>

// CRUD
createProject(name: string): Promise<string>
deleteProject(projectId: string): Promise<void>
setActiveProject(projectId: string): Promise<void>
updateProjectData(projectId: string, database: Database): Promise<void>
updateProjectMetadata(projectId: string, metadata: any): Promise<void>

// Queries
getProject(projectId: string): Project | null
getProjectData(projectId: string): ProjectData | null
getActiveProjectData(): ProjectData | null

// Sync
syncToRepository(): Promise<void>
reloadFromRepository(): Promise<void>

// State
projects: Project[]
activeProjectId: string | null
isInitialized: boolean
isSyncing: boolean
```

### DataStore Methods

```typescript
// Sync with project
syncWithProject(projectId: string): void
saveToProject(projectId: string): Promise<void>

// All CRUD operations are synchronous, then saved via saveToProject()
addWorkGroup(workGroup: WorkGroup): void
updateWorkGroup(index: number, workGroup: WorkGroup): void
deleteWorkGroup(index: number): void

// ... similar for Works, Trains, TimetableRows
```

### EditorStore Methods

```typescript
// Sync with project
syncWithProject(projectId: string): void
saveToProject(projectId: string): Promise<void>

// Station operations
addStation(station: Station): void
updateStation(stationId: string, station: Station): void
deleteStation(stationId: string): void
getStation(stationId: string): Station | null

// Line operations
addLine(line: Line): void
updateLine(lineId: string, line: Line): void
deleteLine(lineId: string): void
getLine(lineId: string): Line | null

// Train type patterns
addTrainTypePattern(pattern: TrainTypePattern): void
updateTrainTypePattern(patternId: string, pattern: TrainTypePattern): void
deleteTrainTypePattern(patternId: string): void
```

## Debugging Commands

### Browser Console

```javascript
// Check current state
const store = window.useProjectStore.getState();
console.log(store.projects);
console.log(store.activeProjectId);

// Check localStorage
JSON.parse(localStorage.getItem('trvis-projects'))

// Check sync status
const repo = window.repositoryFactory.getDefaultRepository();
console.log(repo.getSyncStatus());

// Force sync
await repo.sync();

// Clear all data
localStorage.clear();
```

### React DevTools Integration

```typescript
// Add display names for debugging
useProjectStore.getState.displayName = 'ProjectStore';
useDataStore.getState.displayName = 'DataStore';
useEditorStore.getState.displayName = 'EditorStore';
```

## Performance Tips

1. **Use selectors** to avoid unnecessary re-renders
   ```typescript
   const projects = useProjectStore((state) => state.projects);
   ```

2. **Debounce saves** (already done in useAutoSave, 500ms)

3. **Batch updates** before saving
   ```typescript
   // Multiple updates, single save
   store.addWorkGroup(wg1);
   store.addWorkGroup(wg2);
   await store.saveToProject(projectId); // One call
   ```

4. **Use getSyncStatus()** before critical operations
   ```typescript
   if (repository.getSyncStatus().isSynced) {
     // Safe to proceed
   }
   ```

## Troubleshooting

### Issue: "Cannot read property 'initialize' of undefined"
```typescript
// ✅ Do this: Make sure to initialize in useEffect
useEffect(() => {
  useProjectStore.getState().initialize();
}, []);
```

### Issue: "Unhandled promise rejection"
```typescript
// ✅ Do this: Always await async operations
await useProjectStore.getState().createProject(name);

// Or use .catch()
useProjectStore.getState().createProject(name)
  .catch(error => console.error(error));
```

### Issue: "Data not persisting"
```typescript
// ✅ Check: Was saveToProject called?
console.log(useDataStore.getState().workGroups);
await useDataStore.getState().saveToProject(projectId);

// ✅ Check: Is initialization complete?
console.log(useProjectStore.getState().isInitialized);
```

### Issue: "Multiple adapters being created"
```typescript
// ✅ Do this: Use factory to avoid duplicates
const repo = repositoryFactory.getDefaultRepository();
// Same instance reused
```

---

**See `src/data/README.md` for full architecture documentation**
