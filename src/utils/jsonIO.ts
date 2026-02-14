import type { Database, Train, TimetableRow, Work, WorkGroup } from '../types/trvis';

/**
 * Validation error information
 */
interface ValidationError {
  path: string;
  message: string;
}

const validationErrors: ValidationError[] = [];

function addError(path: string, message: string): void {
  validationErrors.push({ path, message });
}

function clearErrors(): void {
  validationErrors.length = 0;
}

function getErrors(): ValidationError[] {
  return [...validationErrors];
}

/**
 * Validate string constraints
 */
function validateString(value: unknown, minLength?: number, maxLength?: number): boolean {
  if (typeof value !== 'string') return false;
  if (minLength !== undefined && value.length < minLength) return false;
  if (maxLength !== undefined && value.length > maxLength) return false;
  return true;
}

/**
 * Validate number constraints
 */
function validateNumber(value: unknown, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Validate hex color code (6-digit format: 000000-FFFFFF)
 */
function validateHexColor(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Validate TimetableRow
 */
function isValidTimetableRow(row: unknown, path: string): row is TimetableRow {
  if (typeof row !== 'object' || row === null) {
    addError(path, 'TimetableRow must be an object');
    return false;
  }

  const r = row as Record<string, unknown>;
  let isValid = true;

  // Required fields
  if (!validateString(r.StationName, 1)) {
    addError(`${path}.StationName`, 'StationName is required and must be a non-empty string');
    isValid = false;
  }

  if (!validateNumber(r.Location_m)) {
    addError(`${path}.Location_m`, 'Location_m is required and must be a number');
    isValid = false;
  }

  // Optional fields with constraints
  if (r.Longitude_deg !== undefined && !validateNumber(r.Longitude_deg, -180, 180)) {
    addError(`${path}.Longitude_deg`, 'Longitude_deg must be a number between -180 and 180');
    isValid = false;
  }

  if (r.Latitude_deg !== undefined && !validateNumber(r.Latitude_deg, -90, 90)) {
    addError(`${path}.Latitude_deg`, 'Latitude_deg must be a number between -90 and 90');
    isValid = false;
  }

  if (r.OnStationDetectRadius_m !== undefined && !validateNumber(r.OnStationDetectRadius_m, 0)) {
    addError(`${path}.OnStationDetectRadius_m`, 'OnStationDetectRadius_m must be a positive number');
    isValid = false;
  }

  if (r.DriveTime_MM !== undefined && !validateNumber(r.DriveTime_MM, 0, 99)) {
    addError(`${path}.DriveTime_MM`, 'DriveTime_MM must be a number between 0 and 99');
    isValid = false;
  }

  if (r.DriveTime_SS !== undefined && !validateNumber(r.DriveTime_SS, 0, 59)) {
    addError(`${path}.DriveTime_SS`, 'DriveTime_SS must be a number between 0 and 59');
    isValid = false;
  }

  if (r.RunInLimit !== undefined && !validateNumber(r.RunInLimit, 0, 999)) {
    addError(`${path}.RunInLimit`, 'RunInLimit must be a number between 0 and 999');
    isValid = false;
  }

  if (r.RunOutLimit !== undefined && !validateNumber(r.RunOutLimit, 0, 999)) {
    addError(`${path}.RunOutLimit`, 'RunOutLimit must be a number between 0 and 999');
    isValid = false;
  }

  if (r.MarkerColor !== undefined && !validateHexColor(r.MarkerColor)) {
    addError(`${path}.MarkerColor`, 'MarkerColor must be a 6-digit hex color code');
    isValid = false;
  }

  return isValid;
}

/**
 * Validate Train
 */
function isValidTrain(train: unknown, path: string): train is Train {
  if (typeof train !== 'object' || train === null) {
    addError(path, 'Train must be an object');
    return false;
  }

  const t = train as Record<string, unknown>;
  let isValid = true;

  // Required fields
  if (!validateString(t.TrainNumber, 1)) {
    addError(`${path}.TrainNumber`, 'TrainNumber is required and must be a non-empty string');
    isValid = false;
  }

  if (typeof t.Direction !== 'number' || isNaN(t.Direction)) {
    addError(`${path}.Direction`, 'Direction is required and must be a number');
    isValid = false;
  }

  if (!Array.isArray(t.TimetableRows)) {
    addError(`${path}.TimetableRows`, 'TimetableRows is required and must be an array');
    isValid = false;
  } else {
    // Validate each TimetableRow
    (t.TimetableRows as unknown[]).forEach((row, index) => {
      if (!isValidTimetableRow(row, `${path}.TimetableRows[${index}]`)) {
        isValid = false;
      }
    });
  }

  // Optional fields with constraints
  if (t.MaxSpeed !== undefined && !validateString(t.MaxSpeed)) {
    addError(`${path}.MaxSpeed`, 'MaxSpeed must be a string');
    isValid = false;
  }

  if (t.SpeedType !== undefined && !validateString(t.SpeedType)) {
    addError(`${path}.SpeedType`, 'SpeedType must be a string');
    isValid = false;
  }

  if (t.NominalTractiveCapacity !== undefined && !validateString(t.NominalTractiveCapacity)) {
    addError(`${path}.NominalTractiveCapacity`, 'NominalTractiveCapacity must be a string');
    isValid = false;
  }

  if (t.CarCount !== undefined && !validateNumber(t.CarCount, 1)) {
    addError(`${path}.CarCount`, 'CarCount must be a number >= 1');
    isValid = false;
  }

  if (t.DayCount !== undefined && !validateNumber(t.DayCount, 0)) {
    addError(`${path}.DayCount`, 'DayCount must be a non-negative number');
    isValid = false;
  }

  if (t.Color !== undefined && !validateHexColor(t.Color)) {
    addError(`${path}.Color`, 'Color must be a 6-digit hex color code');
    isValid = false;
  }

  return isValid;
}

/**
 * Validate Work
 */
function isValidWork(work: unknown, path: string): work is Work {
  if (typeof work !== 'object' || work === null) {
    addError(path, 'Work must be an object');
    return false;
  }

  const w = work as Record<string, unknown>;
  let isValid = true;

  // Required fields
  if (!validateString(w.Name, 1)) {
    addError(`${path}.Name`, 'Name is required and must be a non-empty string');
    isValid = false;
  }

  if (!Array.isArray(w.Trains)) {
    addError(`${path}.Trains`, 'Trains is required and must be an array');
    isValid = false;
  } else {
    // Validate each Train
    (w.Trains as unknown[]).forEach((train, index) => {
      if (!isValidTrain(train, `${path}.Trains[${index}]`)) {
        isValid = false;
      }
    });
  }

  // Optional fields with constraints
  if (w.AffectDate !== undefined && !validateString(w.AffectDate, 1)) {
    addError(`${path}.AffectDate`, 'AffectDate must be a non-empty string');
    isValid = false;
  }

  return isValid;
}

/**
 * Validate WorkGroup
 */
function isValidWorkGroup(workGroup: unknown, path: string): workGroup is WorkGroup {
  if (typeof workGroup !== 'object' || workGroup === null) {
    addError(path, 'WorkGroup must be an object');
    return false;
  }

  const wg = workGroup as Record<string, unknown>;
  let isValid = true;

  // Required fields
  if (!validateString(wg.Name, 1)) {
    addError(`${path}.Name`, 'Name is required and must be a non-empty string');
    isValid = false;
  }

  if (!Array.isArray(wg.Works)) {
    addError(`${path}.Works`, 'Works is required and must be an array');
    isValid = false;
  } else {
    // Validate each Work
    (wg.Works as unknown[]).forEach((work, index) => {
      if (!isValidWork(work, `${path}.Works[${index}]`)) {
        isValid = false;
      }
    });
  }

  // Optional fields
  if (wg.DBVersion !== undefined && !validateNumber(wg.DBVersion, 0)) {
    addError(`${path}.DBVersion`, 'DBVersion must be a non-negative number');
    isValid = false;
  }

  return isValid;
}

/**
 * Validate if a parsed object matches the TRViS Database schema
 */
export function isValidDatabase(data: unknown): data is Database {
  clearErrors();

  if (!Array.isArray(data)) {
    addError('root', 'Database must be an array');
    return false;
  }

  if (data.length === 0) {
    return true;
  }

  let isValid = true;
  data.forEach((workGroup, index) => {
    if (!isValidWorkGroup(workGroup, `Database[${index}]`)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Get validation errors from last validation
 */
export function getValidationErrors(): ValidationError[] {
  return getErrors();
}

/**
 * Parse JSON string and validate as TRViS Database
 */
export function parseDatabase(jsonString: string): { data: Database; error: null } | { data: null; error: string } {
  try {
    const parsed = JSON.parse(jsonString);

    if (!isValidDatabase(parsed)) {
      const errors = getValidationErrors();
      const errorMessages = errors.map(e => `${e.path}: ${e.message}`).join('\n');
      return {
        data: null,
        error: `Invalid TRViS database format:\n${errorMessages}`,
      };
    }

    return { data: parsed, error: null };
  } catch (error) {
    return {
      data: null,
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Export Database to JSON string
 */
export function databaseToJSON(database: Database): string {
  return JSON.stringify(database, null, 2);
}

/**
 * Download database as JSON file
 */
export function downloadDatabase(database: Database, filename: string): void {
  const jsonString = databaseToJSON(database);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        resolve(text);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}
