# System Architecture Diagram

## Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                  (React Components)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ EditorPage | SettingsPage | ImportExport Components │   │
│  └────────────────┬─────────────────────────────────────┘   │
└───────────────────┼──────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYER                    │
│                   (Zustand Stores)                           │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ProjectStore     │  │ DataStore    │  │ EditorStore  │  │
│  │                  │  │              │  │              │  │
│  │ - Projects       │  │ - WorkGroups │  │ - Stations   │  │
│  │ - Active Project │  │ - Trains     │  │ - Lines      │  │
│  │ - ProjectData    │  │ - Timetables │  │ - Patterns   │  │
│  └────────┬─────────┘  └──────┬───────┘  └───────┬──────┘  │
└───────────┼──────────────────────┼───────────────┼──────────┘
            │                      │               │
            └──────────────────────┼───────────────┘
                                   │
                                   ▼ (async/await)
┌──────────────────────────────────────────────────────────────┐
│              ABSTRACTION LAYER                               │
│         (IDataRepository Interface)                          │
│                                                              │
│                  ┌──────────────────┐                       │
│                  │ Repository Ops   │                       │
│                  │                  │                       │
│                  │ - CRUD Projects  │                       │
│                  │ - Batch Ops      │                       │
│                  │ - Sync Management│                       │
│                  │ - Error Handling │                       │
│                  └──────────────────┘                       │
└────────────┬──────────────────────┬──────────────┬──────────┘
             │                      │              │
             │                      │              │
    ┌────────▼────┐       ┌─────────▼──────┐    ┌─▼──────────┐
    │   LOCAL     │       │     HTTP       │    │  CUSTOM    │
    │  STORAGE    │       │    ADAPTER     │    │  ADAPTERS  │
    │  ADAPTER    │       │                │    │ (Future)   │
    │             │       │  • Retry logic │    │            │
    │ • Validation│       │  • Offline     │    │ • Encrypted│
    │ • Error     │       │    support     │    │ • Database │
    │   handling  │       │  • Net status  │    │ • etc.     │
    └────────┬────┘       └────────┬───────┘    └─┬──────────┘
             │                     │              │
             │                     │              │
    ┌────────▼────────────────────▼──────────────▼──────┐
    │           PERSISTENCE LAYER                      │
    │                                                   │
    │ ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
    │ │ localStorage │  │ Backend    │  │ Database/ │ │
    │ │              │  │ HTTP API   │  │ File      │ │
    │ │ (Current)    │  │ (Future)   │  │ System    │ │
    │ └──────────────┘  └────────────┘  └───────────┘ │
    └───────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Current Flow (localStorage)

```
User Action
   │
   ├─ Types component (e.g., create project)
   │
   ▼
ProjectStore.createProject(name)
   │
   ├─ Generate UUID
   ├─ Create ProjectData object
   │
   ▼
repository.createProject(projectData)
   │
   ├─ RepositoryFactory.getDefaultRepository()
   │
   ▼
LocalStorageAdapter.createProject()
   │
   ├─ Validate data
   ├─ Check for duplicates
   │
   ▼
JSON.stringify(projectData)
   │
   ▼
localStorage.setItem('trvis-projects', json)
   │
   ▼
Data Persisted ✓
   │
   ▼
Return ProjectData to Store
   │
   ▼
Update Zustand State
   │
   ▼
Re-render Components
```

### Future Flow (HTTP Backend)

```
User Action
   │
   ├─ Types component (e.g., create project)
   │
   ▼
ProjectStore.createProject(name)
   │
   ├─ Generate UUID
   ├─ Create ProjectData object
   │
   ▼
repository.createProject(projectData)
   │
   ├─ RepositoryFactory.getDefaultRepository()
   │
   ▼
HttpAdapter.createProject()
   │
   ├─ Check network status
   │
   ├── ONLINE ─────────┐
   │                   │
   │    Network UP     │  Network DOWN / OFFLINE
   │                   │      (Automatic)
   │     Retry with    │
   │  exponential      │
   │   backoff         ├─ Queue operation
   │                   │
   │   ┌─────────┐     │  Store in
   │   │ HTTP    │     │  pendingOps
   │   │ Request │     │
   │   └────┬────┘     │
   │        │          │
   │    Success?       │  Wait for network
   │        │          │
   │       YES ─────┐   │
   │        │      │   │
   │        NO ──┐ │   │
   │           │ │ │   │
   │      Retry  │ │   │
   │      again  │ │   │
   │           │ │ │   │
   └───────────┼─┘ │   │
               │   │   │
               │   ▼   ▼
         Data persisted / queued
               │
               ▼
      Update sync status
               │
               ▼
   Update Zustand State
               │
               ▼
      Re-render Components
               │
               ▼
         When network returns:
         Automatically retry
         queued operations
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│               REACT COMPONENTS                          │
└────────────┬─────────────────────────────────────┬──────┘
             │                                     │
      ┌──────▼──────┐                        ┌────▼──────┐
      │EditorPage   │                        │SettingsPage
      │             │                        │
      │ - Uses      │                        │ - Uses
      │   DataStore │                        │   ProjectStore
      │   EditorStore                        │   EditorStore
      └──────┬──────┘                        └────┬───────┘
             │                                    │
             │        ┌────────────────────┐      │
             └───────►│ useAutoSave Hook   │◄─────┘
                      │                    │
                      │ - Debounce: 500ms │
                      │ - Batch updates   │
                      │ - Save to project │
                      └────────┬───────────┘
                               │
                      ┌────────▼──────────┐
                      │ ProjectStore      │
                      │                   │
                      │ initialize()      │
                      │ createProject()   │
                      │ updateProjectData()
                      │ saveToProject()   │
                      └────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         ┌────▼────┐    ┌──────▼──────┐   ┌────▼─────┐
         │DataStore│    │EditorStore  │   │ProjectStore
         │          │    │             │   │(methods)
         │synWith- │    │ syncWith-   │   │
         │Project()│    │ Project()   │   │ saveToProject()
         │          │    │             │   │
         └────┬────┘    └──────┬──────┘   └────┬──────┘
              │                │               │
              └────────────────┼───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Repository Layer   │
                    │                     │
                    │ IDataRepository     │
                    │                     │
                    │ - createProject()   │
                    │ - updateProject()   │
                    │ - saveStorageState()│
                    │ - getSyncStatus()   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Adapter Layer      │
                    │                     │
                    │ LocalStorageAdapter │
                    │ HttpAdapter         │
                    │ CustomAdapters      │
                    └─────────────────────┘
```

## State Management Flow

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│ ProjectStore    │         │  DataStore      │         │ EditorStore  │
│                 │         │                 │         │              │
│ projects: []    │         │ workGroups: []  │         │ stations: [] │
│ projectData: {} │         │                 │         │ lines: []    │
│ activeProject   │         │                 │         │ patterns: [] │
│ ID              │         │                 │         │              │
└────────┬────────┘         └────────┬────────┘         └──────┬───────┘
         │                          │                         │
         │ ◄─── useAutoSave Hook ──►│                         │
         │          (triggers)      │◄────────────────────────┘
         │                          │
         │ Debounce: 500ms          │
         │                          │
         ├──► saveToProject(id)     │
         │         │                │
         │         ▼                │
         │    repository.updateProject()
         │         │                │
         │         ▼                ▼
         │    LocalStorageAdapter / HttpAdapter
         │         │
         ▼         ▼
    Sync Status ◄─ persist()
    ┌──────────────────────┐
    │ isSynced: true       │
    │ lastSyncTime: xxx    │
    │ pendingChanges: 0    │
    │ syncError: null      │
    └──────────────────────┘
         │
         ▼
    Re-render subscribed components
```

## Error Handling Flow

```
┌────────────────────────────────────────┐
│ Async Operation Started                │
│ (e.g., createProject)                  │
└────────────┬─────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Repository Operation   │
    └────────┬───────────────┘
             │
       ┌─────┴──────┐
       │            │
    SUCCESS       ERROR
       │            │
       ▼            ▼
   ┌───────┐  ┌──────────────┐
   │Return │  │ Catch Error  │
   │Data   │  │ & Log        │
   └───┬───┘  └────┬─────────┘
       │           │
       │      ┌────▼──────┐
       │      │Result      │
       │      │{           │
       │      │ success:   │
       │      │ false,     │
       │      │ error: err │
       │      │}           │
       │      └────┬───────┘
       │           │
       └───────┬───┘
               │
               ▼
    ┌─────────────────────────┐
    │ Handle in Store/UI      │
    │                         │
    │ if (result.success) {   │
    │   updateUI()            │
    │ } else {                │
    │   showError(result.err) │
    │ }                       │
    └─────────────────────────┘
```

## Sequence Diagram: Project Creation

```
User          Component      Store         Repository      Adapter       Storage
 │                │             │              │              │             │
 ├─ Click ───────►│             │              │              │             │
 │ "Create        │             │              │              │             │
 │  Project"      │             │              │              │             │
 │                │             │              │              │             │
 │                ├─ createProject(name)       │              │             │
 │                │             │              │              │             │
 │                │             ├─ repo.createProject(data)   │             │
 │                │             │              │              │             │
 │                │             │              ├─ LocalStorage/Http
 │                │             │              │ Operation    │             │
 │                │             │              │              ├─ Validate  │
 │                │             │              │              ├─ Persist ──┤─ Save
 │                │             │              │              │              │
 │                │             │◄─────────────────── Result ─────────────◄─┤
 │                │             │              │              │             │
 │                │◄─ ProjectId ─┤              │              │             │
 │                │              │              │              │             │
 │◄─────────────────── Show Success ──────────────────────────────────────┤
 │                │              │              │              │             │
```

## Sync Status Timeline

### LocalStorage
```
Timeline:  T0 ─── T1 ─── T2 ─── T3 ─── T4 ─── T5

User Action (T1)
     │
     ▼
State Updated
     │
     ▼
Auto-save (500ms debounce) (T1.5)
     │
     ▼
Repository.updateProject() (T2)
     │
     ▼
localStorage persisted (T2)
     │
     ▼
SyncStatus { isSynced: true, lastSyncTime: T2 } (T2)
     │
     ▼
Components re-render (T2)
```

### HTTP Backend (Offline)
```
Timeline:  T0 ─── T1 ─── T2 ─── T3 ─── T4 ─── T5

User Action (T1)                  Network returns (T4)
     │                                 │
     ▼                                 │
State Updated                          │
     │                                 │
     ▼                                 │
Auto-save (500ms debounce) (T1.5)    │
     │                                 │
     ▼                                 │
Repository.updateProject() (T2)     │
     │                                 │
     ├─ Network check: OFFLINE        │
     │                                 │
     ▼                                 │
Operation queued (T2)                  │
     │                                 │
     ▼                                 │
SyncStatus {                           │
  isSynced: false,                    │
  lastSyncTime: T0,                   │
  pendingChanges: 1                   │
} (T2)                                 │
     │                                 │
     ├─ Wait for network...            │
     │                                 ◄─
     │                                 │
     ▼                                 │
Automatic sync triggered (T4)          │
     │                                 │
     ▼                                 │
Retry queued operation (T4)           │
     │                                 │
     ▼                                 │
HTTP Request successful (T4)          │
     │                                 │
     ▼                                 │
SyncStatus { isSynced: true } (T4)   │
     │                                 │
     ▼                                 │
Components re-render (T4)
```

## Project Data Structure

```
ProjectData {
  ├─ id: "uuid-1234"
  │
  ├─ name: "Tokyo Lines"
  │
  ├─ createdAt: 1234567890
  ├─ lastModified: 1234567890
  │
  ├─ database: {
  │    └─ workGroups: [
  │         {
  │           Name: "Monday Schedule"
  │           Works: [
  │             {
  │               Name: "Service A"
  │               AffectDate: "2024-01-15"
  │               Trains: [
  │                 {
  │                   Id: "train-123"
  │                   TrainNumber: "LX001"
  │                   Direction: 1
  │                   MaxSpeed: 100
  │                   CarCount: 6
  │                   TimetableRows: [...]
  │                 }
  │               ]
  │             }
  │           ]
  │         }
  │       ]
  │  }
  │
  └─ metadata: {
       ├─ stations: [
       │    {
       │      id: "st-123"
       │      name: "Shibuya"
       │      fullName: "Shibuya Station"
       │      longitude: 139.7016
       │      latitude: 35.6595
       │    }
       │  ]
       │
       ├─ lines: [
       │    {
       │      id: "line-123"
       │      name: "Yamanote Line"
       │      stations: [...]
       │    }
       │  ]
       │
       └─ trainTypePatterns: [
            {
              id: "pattern-123"
              lineId: "line-123"
              typeName: "Rapid"
              intervals: [...]
            }
          ]
    }
}
```

---

This architecture ensures:
- ✅ Clear separation of concerns
- ✅ Easy testing and mocking
- ✅ Seamless transition to backend
- ✅ Type-safe operations
- ✅ Comprehensive error handling
