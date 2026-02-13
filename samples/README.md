# Sample Timetable Data

This directory contains example TRViS timetable files for testing and learning how to use the TRViS Editor Offline.

## Files

### sample-yamanote-line.json
**Yamanote Line (山手線) - Simple Example**

A basic example with:
- 1 WorkGroup: "山手線"
- 1 Work: "平日" (Weekday)
- 2 Trains: "普通 10時方向", "普通 11時方向"
- 6 stations: 東京 → 神田 → 秋葉原 → 御茶ノ水 → 新宿 → 渋谷

**Best for:** Understanding the basic structure and editing timetables inline.

### sample-chuo-line.json
**Chuo Line (中央線) - Express & Local Service**

A more complex example with:
- 1 WorkGroup: "中央線"
- 1 Work: "平日朝" (Weekday Morning)
- 2 different Trains: "快速" (Express) and "普通" (Local)
- 5 stations with different stopping patterns
- Different travel times for express vs. local trains

**Best for:** Learning about different train types and schedules.

### sample-complex-schedule.json
**Tokyo Metro Marunouchi Line (営団地下鉄丸ノ内線) - Complex Timetable**

A comprehensive example with:
- 1 WorkGroup: "営団地下鉄丸ノ内線"
- 2 Works: "平日" (Weekday) and "休日" (Holiday)
- 3 Trains: Two trains for weekday, one for holiday
- 16 stations: Full line with realistic timings
- Multiple tracks and different schedules for different days

**Best for:** Seeing a complete, realistic timetable with multiple works and trains.

## How to Use

1. Open the TRViS Editor Offline application
2. Create a new project
3. Go to **Settings** (gear icon or sidebar)
4. Under "Import JSON Timetable", click **"Import JSON File"**
5. Select one of the sample files (e.g., `sample-yamanote-line.json`)
6. The data will load into your active project
7. Explore the WorkGroups, Works, Trains, and Timetables
8. Edit any data directly in the UI

## What to Try

### After Importing sample-yamanote-line.json:
1. Click on a train in the Work Groups tab to see the full timetable
2. Try editing arrival/departure times directly in the grid
3. Try the "Time Adjustment" feature (click the timeline icon on a row)
4. Go to Settings and generate an AppLink to see your data encoded

### After Importing sample-complex-schedule.json:
1. Switch between "平日" and "休日" works to see different schedules
2. Notice how the two train types have different stopping patterns
3. Edit a station name and see how changes propagate
4. Try cloning one of the trains and assigning a new train number

## Data Format Notes

All sample files follow the official TRViS JSON schema:

- **Time format**: HH:MM:SS (24-hour, e.g., "08:30:00" for 8:30 AM)
- **Location_m**: Distance in meters from the start of the line
- **Direction**: 1 for descending, -1 for ascending
- **AffectDate**: Effective date in YYYYMMDD format

## Creating Your Own Data

The easiest way to create timetables:

1. **With Station/Line Management**:
   - Go to Stations tab → Add your stations
   - Go to Lines tab → Create a line and add stations with distances
   - Create trains and edit timetables directly

2. **With Train Type Patterns** (for similar schedules):
   - Go to Train Types tab → Create a pattern with intervals
   - Go to TrainEditor → Use "Generate from Pattern"
   - Specify departure time, schedule is auto-generated

3. **By Importing & Editing**:
   - Import one of these samples as a starting point
   - Modify the data to match your needs
   - Export as JSON when done

## Tips

- **Start simple**: Begin with `sample-yamanote-line.json` to understand the structure
- **Use patterns**: For repetitive schedules, use Train Type Patterns to auto-generate timetables
- **Test before sharing**: After editing, generate an AppLink and test it with the TRViS app
- **Backup frequently**: Use Settings → "Export All Data" to backup your work

## Questions?

If you have questions about the format or how to use these samples:
1. Check the main README.md for detailed usage guide
2. Look at the application UI - it provides helpful tooltips
3. Try importing multiple samples to understand different patterns

Happy timetabling! 🚂
