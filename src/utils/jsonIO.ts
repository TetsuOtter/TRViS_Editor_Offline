import type { Database } from '../types/trvis';

/**
 * Validate if a parsed object matches the TRViS Database schema
 */
export function isValidDatabase(data: unknown): data is Database {
  if (!Array.isArray(data)) return false;

  return data.every((workGroup) => {
    if (typeof workGroup !== 'object' || workGroup === null) return false;

    const wg = workGroup as Record<string, unknown>;

    // Required fields
    if (typeof wg.Name !== 'string') return false;
    if (!Array.isArray(wg.Works)) return false;

    // Validate Works
    return (wg.Works as unknown[]).every((work) => {
      if (typeof work !== 'object' || work === null) return false;
      const w = work as Record<string, unknown>;

      if (typeof w.Name !== 'string') return false;
      if (typeof w.AffectDate !== 'string') return false;
      if (!Array.isArray(w.Trains)) return false;

      // Validate Trains
      return (w.Trains as unknown[]).every((train) => {
        if (typeof train !== 'object' || train === null) return false;
        const t = train as Record<string, unknown>;

        if (typeof t.TrainNumber !== 'string') return false;
        if (typeof t.Direction !== 'number' || (t.Direction !== 1 && t.Direction !== -1))
          return false;
        if (!Array.isArray(t.TimetableRows)) return false;

        // Validate TimetableRows
        return (t.TimetableRows as unknown[]).every((row) => {
          if (typeof row !== 'object' || row === null) return false;
          const r = row as Record<string, unknown>;

          if (typeof r.StationName !== 'string') return false;
          if (typeof r.Location_m !== 'number') return false;

          return true;
        });
      });
    });
  });
}

/**
 * Parse JSON string and validate as TRViS Database
 */
export function parseDatabase(jsonString: string): { data: Database; error: null } | { data: null; error: string } {
  try {
    const parsed = JSON.parse(jsonString);

    if (!isValidDatabase(parsed)) {
      return {
        data: null,
        error: 'Invalid TRViS database format. Please check the JSON structure.',
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
