# TRViS Editor Offline

A web-based offline editor for TRViS (Train Timetable Visualization System) JSON timetable files. Create, edit, and manage train schedules with an intuitive UI, then share them with the TRViS app via AppLink.

## Features

### 📋 Core Functionality
- **Project Management**: Create and manage multiple timetable projects with auto-save
- **Hierarchical Data Model**: WorkGroups → Works → Trains → Timetables
- **JSON Import/Export**: Load existing TRViS JSON files and export your creations
- **Full LocalStorage Backup**: Export/import complete project data for backup and restoration

### 🚄 Train Schedule Management
- **Train CRUD**: Create, edit, clone, and delete trains with ease
- **Inline Timetable Editing**: Edit arrival/departure times, station names, and properties directly in a data grid
- **Time Adjustment**: Cascade time changes to all subsequent stops with a single dialog
- **Train Cloning**: Duplicate trains and assign new train numbers instantly

### 📍 Line & Station Management
- **Station Master**: Create and manage station information (name, full name, coordinates)
- **Line Editor**: Organize stations into lines with distance tracking
- **Reorderable Stations**: Rearrange station order on lines with intuitive up/down controls
- **Cascading Deletion**: Automatically remove stations from all lines when deleted

### 🚂 Train Type Patterns (Scheduling Templates)
- **Pattern Definition**: Create train type patterns (e.g., "普通", "急行", "特快")
- **Interval Configuration**: Define driving times between consecutive stations
- **Auto-Generation**: Generate complete train schedules from patterns with custom departure times
- **Flexible Scheduling**: Patterns support different travel times for different train types

### 🔗 Sharing & Integration
- **AppLink Generation**: Create shareable links for the TRViS app (`trvis://app/open/json?data=...`)
- **Copy-to-Clipboard**: Easy one-click copying for AppLink URLs
- **Deep Integration**: Send timetable data directly to the TRViS app

### ⚙️ Settings & Backup
- **Full Data Export**: Backup all projects, workgroups, stations, lines, and patterns to JSON
- **Data Import**: Restore from backup files
- **Settings Page**: Centralized management for all export/import features

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/TRViS-Editor-Offline.git
cd TRViS-Editor-Offline

# Install dependencies
yarn install

# Start development server
yarn dev
```

Open http://localhost:5173 in your browser.

### Building for Production

```bash
yarn build
```

## Usage Guide

### Basic Workflow

1. **Create a Project**: Click "Add Project" and name your timetable
2. **Create Stations**: Go to "Stations" tab and add all stations
3. **Create a Line**: Go to "Lines" tab and organize stations with distances
4. **Define Train Type (Optional)**: Go to "Train Types" and create patterns with intervals
5. **Create WorkGroup & Work**: Go to "Work Groups" and set up your schedule
6. **Add Trains**: Use "Add Train" or "Generate from Pattern" to create trains
7. **Edit Timetable**: Click on trains to inline-edit arrival/departure times
8. **Share**: Go to Settings and generate an AppLink to share with TRViS app

### Detailed Features

#### Train Cloning
- Select a train and click the "Clone" button
- Assign a new train number
- Trains keep the same timetable

#### Time Adjustment
- In the timetable grid, click the timeline icon on any row
- Set time delta (format: ±MM:SS)
- All subsequent times are adjusted automatically

#### Pattern-Based Generation
- Create a TrainTypePattern with intervals between stations
- Click "Generate from Pattern" in TrainEditor
- Select the pattern and departure time
- Complete timetable is auto-generated

#### AppLink Sharing
1. Go to Settings
2. Click "Generate AppLink"
3. Copy the URL
4. Share with TRViS app (opens in TRViS app with your data)

## Data Format

### TRViS JSON Schema

```typescript
type Database = WorkGroup[]

interface WorkGroup {
  Id: string
  Name: string
  Works: Work[]
}

interface Work {
  Id: string
  Name: string
  AffectDate: string           // YYYYMMDD
  Remarks?: string             // HTML supported
  Trains: Train[]
}

interface Train {
  Id: string
  TrainNumber: string
  Direction: number            // 1: Descending, -1: Ascending
  MaxSpeed?: number            // km/h
  CarCount?: number
  Destination?: string
  TimetableRows: TimetableRow[]
}

interface TimetableRow {
  Id: string
  StationName: string
  FullName?: string
  Location_m: number           // Distance in meters
  Arrive?: string              // HH:MM:SS
  Departure?: string           // HH:MM:SS
  TrackName?: string
  IsPass?: boolean
}
```

## Sample Data

The `samples/` directory contains example files for testing:

- `sample-yamanote-line.json` - Yamanote Line (山手線)
- `sample-chuo-line.json` - Chuo Line (中央線)
- `sample-complex-schedule.json` - Multi-line example

Import these in Settings → "Import JSON Timetable" to test.

## Technical Stack

- **React 19** with TypeScript
- **Material-UI v7** for UI components
- **Zustand** for state management
- **React Router v7** for navigation
- **MUI X-DataGrid** for table editing
- **Vite 7** for fast development and building

## Project Structure

```
src/
├── components/          # React components
│   ├── ImportExport/   # JSON and AppLink features
│   ├── LineManager/    # Stations, lines, patterns
│   ├── TrainEditor/    # Train editing
│   └── TimetableEditor/# Timetable grid
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── store/              # Zustand stores
├── types/              # TypeScript types
├── utils/              # Utilities
├── App.tsx             # Main app
└── main.tsx           # Entry point
```

## Keyboard Shortcuts

- **Enter** - Submit forms
- **Escape** - Cancel dialogs
- **Up/Down arrows** - Reorder items (where available)

## Tips

1. **Define patterns first**: Set up train types before generating trains
2. **Use samples**: Import sample data to understand the format
3. **Test with AppLink**: Copy the generated AppLink and verify it works
4. **Regular backups**: Export data to JSON regularly for safety

## System Requirements

- Modern browser (Chrome 87+, Firefox 78+, Safari 14+, Edge 87+)
- ~50MB LocalStorage capacity
- No internet required (fully offline-capable)

## Support & Contributing

- **Issues**: Report bugs on GitHub
- **Contributions**: Pull requests welcome!
- **License**: MIT

---

**Happy timetable editing!** 🚂
