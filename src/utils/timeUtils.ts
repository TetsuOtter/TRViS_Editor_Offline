/**
 * Utilities for handling HH:MM:SS time strings
 */

export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Parse HH:MM:SS time string to total seconds
 */
export function timeStringToSeconds(time: string | null | undefined): number {
  if (!time) return 0;

  const match = time.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convert total seconds to HH:MM:SS time string
 */
export function secondsToTimeString(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Adjust a time string by a given number of seconds
 * Returns null if input is null/undefined
 */
export function adjustTime(time: string | null | undefined, deltaSeconds: number): string | null {
  if (!time) return null;

  const totalSeconds = timeStringToSeconds(time);
  const newSeconds = Math.max(0, totalSeconds + deltaSeconds);

  return secondsToTimeString(newSeconds);
}

/**
 * Calculate the time difference between two time strings in seconds
 * Returns negative if from > to
 */
export function timeDiff(from: string | null | undefined, to: string | null | undefined): number {
  if (!from || !to) return 0;

  const fromSeconds = timeStringToSeconds(from);
  const toSeconds = timeStringToSeconds(to);

  return toSeconds - fromSeconds;
}

/**
 * Get time components from HH:MM:SS string
 */
export function parseTimeComponents(time: string | null | undefined): TimeComponents {
  const totalSeconds = timeStringToSeconds(time);

  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
