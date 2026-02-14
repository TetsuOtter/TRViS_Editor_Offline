# Data Repository Layer Architecture

## Overview

The data repository layer is an abstraction that separates data persistence from business logic. This design allows the application to:

- **Transition from localStorage to a backend API** without changing store logic
- **Support offline-first functionality** with eventual sync capability
- **Maintain data consistency** across different storage mechanisms
- **Enable comprehensive testing** of persistence logic independently

## Architecture

### Layer Stack

```
┌─────────────────────────────────────┐
│     UI Components (React)           │
│  (Pages, Dialogs, Forms)            │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│     Zustand Stores                  │
│  (projectStore, dataStore,          │
│   editorStore)                      │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│  IDataRepository (Interface)        │
│  (Abstraction Contract)             │
└────────────────┬────────────────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
┌────▼──┐  ┌────▼──┐  ┌────▼──┐
│LocalSt│  │ HTTP  │  │Future │
│orage  │  │Adapter│  │Custom │
│Adapter│  │       │  │Adapter│
└───────┘  └───────┘  └───────┘
     │           │           │
     └───────────┼───────────┘
                 │
         ┌───────▼────────┐
         │Actual Storage  │
         │ localStorage,  │
         │ Backend API,   │
         │ etc.           │
         └────────────────┘
```

### Core Components

#### 1. **IDataRepository Interface** (`src/data/types.ts`)

The contract that all repository adapters must implement:

```typescript
interface IDataRepository {
  // Initialization
  initialize(): Promise<Result<void>>;
  isReady(): boolean;

  // Project CRUD
  createProject(project: ProjectData): Promise<Result<ProjectData>>;
  getProject(projectId: string): Promise<Result<ProjectData>>;
  updateProject(projectId: string, project: ProjectData): Promise<Result<ProjectData>>;
  deleteProject(projectId: string): Promise<Result<void>>;
  projectExists(projectId: string): Promise<Result<boolean>>;

  // Batch Operations
  getAllProjects(): Promise<Result<StorageState>>;
  saveStorageState(state: StorageState): Promise<Result<void>>;
  loadStorageState(): Promise<Result<StorageState>>;

  // Sync Management
  getSyncStatus(): SyncStatus;
  sync(): Promise<Result<void>>;
  clearPending(): Promise<Result<void>>;

  // Cleanup
  close(): Promise<void>;
}
```

#### 2. **LocalStorageAdapter** (`src/data/adapters/LocalStorageAdapter.ts`)

Current production implementation using browser's localStorage.

**Key Features:**
- Synchronous operations wrapped as async Promises
- Automatic sync status (always synced for localStorage)
- Error handling and validation
- Direct JSON serialization/deserialization

**Usage:**
```typescript
const adapter = new LocalStorageAdapter({
  storageKey: 'trvis-projects'
});
```

#### 3. **HttpAdapter** (`src/data/adapters/HttpAdapter.ts`)

Placeholder for future backend integration.

**Key Features:**
- Automatic retry logic with exponential backoff
- Offline support with pending operation queuing
- Network status detection
- Configurable timeout and retry parameters

**Usage:**
```typescript
const adapter = new HttpAdapter({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000
});
```

#### 4. **RepositoryFactory** (`src/data/RepositoryFactory.ts`)

Manages repository instances with caching and configuration.

```typescript
// Get default localStorage repository
const repo = repositoryFactory.getDefaultRepository();

// Create specific adapter
const customRepo = repositoryFactory.createRepository({
  type: 'http',
  baseUrl: 'https://api.example.com'
});
```

### Zustand Stores Integration

#### **ProjectStore** (`src/store/projectStore.ts`)

Manages project lifecycle through the repository layer.

```typescript
// All operations are now async and repository-backed
const projectId = await useProjectStore.getState().createProject('My Project');
await useProjectStore.getState().deleteProject(projectId);
await useProjectStore.getState().setActiveProject(projectId);
```

#### **DataStore** (`src/store/dataStore.ts`)

Handles timetable data (workgroups, trains, etc.).

```typescript
await useDataStore.getState().saveToProject(projectId);
```

#### **EditorStore** (`src/store/editorStore.ts`)

Manages station, line, and train type pattern metadata.

```typescript
await useEditorStore.getState().saveToProject(projectId);
```

### Auto-Save Hook

The `useAutoSave` hook automatically persists changes through the repository:

```typescript
export function useAutoSave(enabled: boolean = true) {
  // Watches changes in stores
  // Batches updates with 500ms debounce
  // Saves through repository layer
}
```

## Data Flow Example

### Creating a Project with Timetable

```
User clicks "Create Project"
  ↓
[UI calls] createProject('Tokyo Lines')
  ↓
[ProjectStore] → generateUUID, create ProjectData object
  ↓
[ProjectStore] → repository.createProject(projectData)
  ↓
[LocalStorageAdapter] → JSON.stringify & localStorage.setItem
  ↓
Project persisted in browser storage
  ↓
User adds timetable data
  ↓
[DataStore] → workGroups array modified
  ↓
[useAutoSave] → 500ms debounce → saveToProject()
  ↓
[DataStore] → repository.updateProject()
  ↓
[LocalStorageAdapter] → update existing localStorage entry
  ↓
Timetable persisted with project
```

## Result Type

All async operations return a `Result<T>` type:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Usage
const result = await repository.createProject(data);
if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Sync Status Tracking

Every repository exposes sync information:

```typescript
interface SyncStatus {
  isSynced: boolean;           // Is data in sync with backend?
  lastSyncTime: number;        // Unix timestamp of last sync
  pendingChanges: number;      // Count of unsaved operations
  syncError?: string;          // Last sync error if any
}

const status = repository.getSyncStatus();
if (!status.isSynced) {
  console.warn(`${status.pendingChanges} changes pending sync`);
  if (status.syncError) {
    console.error('Sync error:', status.syncError);
  }
}
```

## Migration Path: localStorage → HTTP

### Current State (localStorage)
```typescript
const adapter = new LocalStorageAdapter({ storageKey: 'trvis-projects' });
```

### Future State (HTTP Backend)
```typescript
const adapter = new HttpAdapter({
  type: 'http',
  baseUrl: 'https://api.trvis.example.com',
  timeout: 5000,
  retryAttempts: 3
});
```

**The entire codebase continues working unchanged!** All stores use the same `IDataRepository` interface.

## Testing Strategy

### Unit Tests

1. **Repository Tests** (`src/data/__tests__/`)
   - `LocalStorageAdapter.test.ts` - localStorage-specific operations
   - `HttpAdapter.test.ts` - API calls, retries, offline handling
   - `RepositoryFactory.test.ts` - instance creation and caching

2. **Store Tests** (`src/store/__tests__/`)
   - `projectStore.integration.test.ts` - store + repository integration

3. **Flow Tests** (`src/data/__tests__/`)
   - `repository.flow.test.ts` - end-to-end data flow validation

### Test Coverage Areas

- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Error handling and validation
- ✅ Data persistence and retrieval
- ✅ Concurrent operations
- ✅ Sync status tracking
- ✅ Offline support (HTTP adapter)
- ✅ Data integrity across serialization
- ✅ Multi-project context switching
- ✅ Page reload scenarios

## Configuration

### Environment Variables

```bash
# Future: Configure which adapter to use
VITE_DATA_BACKEND=localStorage  # or 'http'
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=5000
```

### Runtime Configuration

```typescript
import { repositoryFactory } from './data/RepositoryFactory';

// At app initialization
const config = {
  type: process.env.VITE_DATA_BACKEND === 'http' ? 'http' : 'localStorage',
  baseUrl: process.env.VITE_API_BASE_URL,
  timeout: parseInt(process.env.VITE_API_TIMEOUT || '5000')
};

const repository = repositoryFactory.createRepository(config);
```

## Best Practices

### 1. Always Use the Repository Interface

```typescript
// ✅ Good: Repository-backed
const result = await repository.createProject(data);

// ❌ Bad: Direct localStorage access
localStorage.setItem('key', JSON.stringify(data));
```

### 2. Handle Result Types Properly

```typescript
// ✅ Good: Check success
const result = await repository.createProject(data);
if (result.success) {
  setState(result.data);
} else {
  showError(result.error);
}

// ❌ Bad: Assume success
const result = await repository.createProject(data);
setState(result.data); // Could be undefined!
```

### 3. Use Sync Status for UI Feedback

```typescript
// ✅ Good: Show sync state
const status = repository.getSyncStatus();
if (!status.isSynced) {
  showBadge('Syncing...'); // or 'Offline'
}
```

### 4. Initialize on App Startup

```typescript
// ✅ Good: Initialize stores before rendering
useEffect(() => {
  useProjectStore.getState().initialize();
}, []);
```

## Future Enhancements

### Dual-Write Pattern (for zero-downtime migration)
```typescript
// Write to both localStorage and backend during transition
const saveToAll = async (data) => {
  await localStorageAdapter.saveStorageState(data);
  await httpAdapter.saveStorageState(data); // Concurrent write
};
```

### Conflict Resolution
```typescript
// For offline-first apps, handle version conflicts
interface ProjectData {
  version: number;
  lastSyncTime: number;
  // ... other fields
}
```

### Encryption at Rest
```typescript
// Add encrypted storage support
const adapter = new EncryptedStorageAdapter({
  encryptionKey: derivedKey,
  baseAdapter: new LocalStorageAdapter()
});
```

## API Endpoint Specifications (for Backend Integration)

When implementing the HTTP adapter's backend, use these endpoints:

```
GET    /api/projects              → Get all projects
GET    /api/projects/:id          → Get single project
POST   /api/projects              → Create project
PUT    /api/projects/:id          → Update project
DELETE /api/projects/:id          → Delete project

POST   /api/storage/save          → Save complete state
GET    /api/storage/load          → Load complete state

GET    /health                    → Health check
```

Expected response format:
```json
{
  "success": true,
  "data": { /* ProjectData or StorageState */ },
  "error": null
}
```
