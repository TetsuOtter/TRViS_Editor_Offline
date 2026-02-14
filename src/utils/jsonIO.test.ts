import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isValidDatabase, parseDatabase, databaseToJSON, downloadDatabase } from './jsonIO'
import type { Database } from '../types/trvis'

describe('jsonIO', () => {
  describe('isValidDatabase', () => {
    it('should validate correct database structure', () => {
      const validDatabase: Database = [
        {
          Name: 'Test WorkGroup',
          Works: [
            {
              Name: 'Test Work',
              AffectDate: '20260213',
              Remarks: '',
              Trains: [
                {
                  TrainNumber: '001',
                  Direction: 1,
                  MaxSpeed: 120,
                  CarCount: 10,
                  Destination: 'Tokyo',
                  WorkType: 0,
                  TimetableRows: [
                    {
                      StationName: 'Tokyo',
                      FullName: 'Tokyo Station',
                      Arrive: '',
                      Departure: '06:00:00',
                      TrackName: '1',
                      Location_m: 0,
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      expect(isValidDatabase(validDatabase)).toBe(true)
    })

    it('should reject non-array input', () => {
      expect(isValidDatabase({})).toBe(false)
      expect(isValidDatabase(null)).toBe(false)
      expect(isValidDatabase('string')).toBe(false)
      expect(isValidDatabase(123)).toBe(false)
    })

    it('should reject invalid workgroup structure', () => {
      const invalidWorkGroup = [
        {
          // Missing Name
          Works: []
        }
      ]

      expect(isValidDatabase(invalidWorkGroup)).toBe(false)
    })

    it('should reject invalid work structure', () => {
      const invalidWork = [
        {
          Name: 'Test WorkGroup',
          Works: [
            {
              Name: 'Test Work',
              // Missing AffectDate
              Trains: []
            }
          ]
        }
      ]

      expect(isValidDatabase(invalidWork)).toBe(false)
    })

    it('should reject invalid train structure', () => {
      const invalidTrain = [
        {
          Name: 'Test WorkGroup',
          Works: [
            {
              Name: 'Test Work',
              AffectDate: '20260213',
              Trains: [
                {
                  TrainNumber: '001',
                  Direction: 2, // Invalid direction (must be 1 or -1)
                  TimetableRows: []
                }
              ]
            }
          ]
        }
      ]

      expect(isValidDatabase(invalidTrain)).toBe(false)
    })

    it('should reject invalid timetable row structure', () => {
      const invalidRow = [
        {
          Name: 'Test WorkGroup',
          Works: [
            {
              Name: 'Test Work',
              AffectDate: '20260213',
              Trains: [
                {
                  TrainNumber: '001',
                  Direction: 1,
                  TimetableRows: [
                    {
                      StationName: 'Tokyo',
                      // Missing Location_m
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      expect(isValidDatabase(invalidRow)).toBe(false)
    })

    it('should accept minimal valid structure', () => {
      const minimalValid = [
        {
          Name: 'Minimal',
          Works: [
            {
              Name: 'Work',
              AffectDate: '20260213',
              Trains: [
                {
                  TrainNumber: '001',
                  Direction: 1,
                  TimetableRows: [
                    {
                      StationName: 'Station',
                      Location_m: 0
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      expect(isValidDatabase(minimalValid)).toBe(true)
    })

    it('should handle empty arrays', () => {
      expect(isValidDatabase([])).toBe(true) // Empty database is valid

      const emptyWorks = [
        {
          Name: 'Empty WorkGroup',
          Works: [] // Empty works array
        }
      ]
      expect(isValidDatabase(emptyWorks)).toBe(true)
    })
  })

  describe('parseDatabase', () => {
    it('should parse valid JSON string', () => {
      const validJSON = JSON.stringify([
        {
          Name: 'Test',
          Works: [
            {
              Name: 'Work',
              AffectDate: '20260213',
              Trains: [
                {
                  TrainNumber: '001',
                  Direction: 1,
                  TimetableRows: [
                    {
                      StationName: 'Station',
                      Location_m: 0
                    }
                  ]
                }
              ]
            }
          ]
        }
      ])

      const result = parseDatabase(validJSON)
      expect(result.error).toBe(null)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should reject invalid JSON', () => {
      const invalidJSON = '{ invalid json syntax'
      const result = parseDatabase(invalidJSON)

      expect(result.data).toBe(null)
      expect(result.error).toContain('Failed to parse JSON')
    })

    it('should reject valid JSON with invalid structure', () => {
      const validJSONInvalidStructure = JSON.stringify({
        notAnArray: true
      })

      const result = parseDatabase(validJSONInvalidStructure)

      expect(result.data).toBe(null)
      expect(result.error).toBe('Invalid TRViS database format. Please check the JSON structure.')
    })

    it('should handle empty string', () => {
      const result = parseDatabase('')
      expect(result.data).toBe(null)
      expect(result.error).toContain('Failed to parse JSON')
    })

    it('should handle null/undefined JSON content', () => {
      const nullJSON = 'null'
      const result = parseDatabase(nullJSON)

      expect(result.data).toBe(null)
      expect(result.error).toBe('Invalid TRViS database format. Please check the JSON structure.')
    })
  })

  describe('databaseToJSON', () => {
    it('should convert database to formatted JSON', () => {
      const database: Database = [
        {
          Name: 'Test WorkGroup',
          Works: [
            {
              Name: 'Test Work',
              AffectDate: '20260213',
              Trains: [
                {
                  TrainNumber: '001',
                  Direction: 1,
                  TimetableRows: [
                    {
                      StationName: 'Tokyo',
                      Location_m: 0
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      const json = databaseToJSON(database)
      expect(typeof json).toBe('string')
      expect(json).toContain('Test WorkGroup')
      expect(json).toContain('Test Work')
      expect(json).toContain('"TrainNumber": "001"')

      // Should be formatted (contains newlines)
      expect(json.includes('\n')).toBe(true)
    })

    it('should handle empty database', () => {
      const emptyDatabase: Database = []
      const json = databaseToJSON(emptyDatabase)
      expect(json).toBe('[]')
    })

    it('should be reversible with parseDatabase', () => {
      const database: Database = [
        {
          Name: 'Round Trip Test',
          Works: [
            {
              Name: 'Work',
              AffectDate: '20260213',
              Trains: [
                {
                  TrainNumber: '002',
                  Direction: -1,
                  MaxSpeed: 100,
                  TimetableRows: [
                    {
                      StationName: 'Station A',
                      Location_m: 1000,
                      Arrive: '10:00:00',
                      Departure: '10:01:00'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      const json = databaseToJSON(database)
      const parsed = parseDatabase(json)

      expect(parsed.error).toBe(null)
      expect(parsed.data).toEqual(database)
    })
  })

  describe('downloadDatabase', () => {
    let originalCreateElement: typeof document.createElement
    let originalCreateObjectURL: typeof URL.createObjectURL
    let originalRevokeObjectURL: typeof URL.revokeObjectURL

    beforeEach(() => {
      // Mock DOM APIs
      originalCreateElement = document.createElement
      originalCreateObjectURL = URL.createObjectURL
      originalRevokeObjectURL = URL.revokeObjectURL

      const mockElement = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
      } as unknown as HTMLAnchorElement

      document.createElement = vi.fn().mockReturnValue(mockElement)
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
      URL.revokeObjectURL = vi.fn()
    })

    afterEach(() => {
      document.createElement = originalCreateElement
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    })

    it('should trigger download with correct filename and content', () => {
      const database: Database = [{
        Name: 'Download Test',
        Works: [{
          Name: 'Work',
          AffectDate: '20260213',
          Trains: []
        }]
      }]

      downloadDatabase(database, 'test.json')

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()

      const mockElement = vi.mocked(document.createElement).mock.results[0].value
      expect(mockElement.download).toBe('test.json')
      expect(mockElement.click).toHaveBeenCalled()
    })
  })

  describe.skip('readFileAsText', () => {
    // Skip FileReader tests for now - they are complex to mock properly
    // In real usage, these would be tested via E2E tests
  })

  describe('integration tests', () => {
    it('should handle complete workflow: parse -> validate -> export', () => {
      const originalJSON = `[
        {
          "Name": "Integration Test",
          "Works": [
            {
              "Name": "Test Work",
              "AffectDate": "20260213",
              "Trains": [
                {
                  "TrainNumber": "999",
                  "Direction": 1,
                  "TimetableRows": [
                    {
                      "StationName": "Start",
                      "Location_m": 0
                    },
                    {
                      "StationName": "End",
                      "Location_m": 5000
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]`

      // Parse
      const parseResult = parseDatabase(originalJSON)
      expect(parseResult.error).toBe(null)
      expect(parseResult.data).toBeDefined()

      // Validate
      expect(isValidDatabase(parseResult.data!)).toBe(true)

      // Export
      const exportedJSON = databaseToJSON(parseResult.data!)
      expect(exportedJSON).toContain('Integration Test')
      expect(exportedJSON).toContain('999')

      // Round trip
      const roundTripResult = parseDatabase(exportedJSON)
      expect(roundTripResult.error).toBe(null)
      expect(roundTripResult.data).toEqual(parseResult.data)
    })
  })
})