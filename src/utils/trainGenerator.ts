import type { TrainTypePattern, Station, Line } from '../types/editor';
import type { TimetableRow } from '../types/trvis';
import { secondsToTimeString, timeStringToSeconds } from './timeUtils';

/**
 * Generate timetable rows from a train type pattern
 * Assumes the pattern intervals are ordered sequentially along the line
 */
export function generateTimetableFromPattern(
  pattern: TrainTypePattern,
  departureTime: string, // HH:MM:SS format
  line: Line,
  stations: Station[]
): TimetableRow[] {
  const lineStations = line.stations;
  if (lineStations.length === 0) return [];

  const stationMap = new Map(stations.map((s) => [s.id, s]));
  const rows: TimetableRow[] = [];

  let currentTimeSeconds = timeStringToSeconds(departureTime);

  // Create interval map for quick lookup
  const intervalMap = new Map<string, typeof pattern.intervals[0]>();
  pattern.intervals.forEach((interval) => {
    intervalMap.set(`${interval.fromStationId}-${interval.toStationId}`, interval);
  });

  // Process each station
  for (let i = 0; i < lineStations.length; i++) {
    const lineStation = lineStations[i];
    const station = stationMap.get(lineStation.stationId);

    if (!station) continue;

    const row: TimetableRow = {
      Id: crypto.getRandomValues(new Uint8Array(16)).toString(),
      StationName: station.name,
      FullName: station.fullName,
      Location_m: lineStation.distanceFromStart_m,
    };

    // For the first station, set departure time
    if (i === 0) {
      row.Departure = departureTime;
    } else {
      // Find the interval from previous station to this station
      const prevLineStation = lineStations[i - 1];
      const interval = intervalMap.get(`${prevLineStation.stationId}-${lineStation.stationId}`);

      if (interval) {
        // Add interval time
        const intervalSeconds = interval.driveTime_MM * 60 + interval.driveTime_SS;
        currentTimeSeconds += intervalSeconds;
        row.Arrive = secondsToTimeString(currentTimeSeconds);

        // For non-terminal stations, add dwell time (default 30 seconds)
        if (i < lineStations.length - 1) {
          currentTimeSeconds += 30; // 30 second dwell
          row.Departure = secondsToTimeString(currentTimeSeconds);
        }
      } else {
        // No interval found, try to estimate
        currentTimeSeconds += 180; // Default 3 minutes
        row.Arrive = secondsToTimeString(currentTimeSeconds);
        if (i < lineStations.length - 1) {
          currentTimeSeconds += 30;
          row.Departure = secondsToTimeString(currentTimeSeconds);
        }
      }
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Validate if all consecutive stations in a line have defined intervals in the pattern
 */
export function validatePatternForLine(
  pattern: TrainTypePattern,
  line: Line
): { valid: boolean; missingIntervals: string[] } {
  const missingIntervals: string[] = [];
  const intervalMap = new Map<string, boolean>();

  pattern.intervals.forEach((interval) => {
    intervalMap.set(`${interval.fromStationId}-${interval.toStationId}`, true);
  });

  for (let i = 0; i < line.stations.length - 1; i++) {
    const from = line.stations[i].stationId;
    const to = line.stations[i + 1].stationId;
    if (!intervalMap.get(`${from}-${to}`)) {
      missingIntervals.push(`${from} → ${to}`);
    }
  }

  return {
    valid: missingIntervals.length === 0,
    missingIntervals,
  };
}
