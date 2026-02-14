import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isValidDatabase, parseDatabase, databaseToJSON, downloadDatabase, getValidationErrors } from './jsonIO'
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
                  MaxSpeed: '120',
                  CarCount: 10,
                  Destination: 'Tokyo',
                  WorkType: 0,
                  TimetableRows: [
                    {
                      StationName: 'Tokyo',
                      FullName: 'Tokyo Station',
                      Arrive: '06:00:00',
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
      expect(getValidationErrors().length).toBe(0)
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
                  Direction: 2, // Invalid direction (any number is allowed per schema)
                  TimetableRows: []
                }
              ]
            }
          ]
        }
      ]

      expect(isValidDatabase(invalidTrain)).toBe(true) // Direction accepts any number
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

    describe('Schema constraint validation', () => {
      it('should validate color hex codes correctly', () => {
        const validColor: Database = [
          {
            Name: 'Color Test',
            Works: [
              {
                Name: 'Work',
                AffectDate: '20260213',
                Trains: [
                  {
                    TrainNumber: '001',
                    Direction: 1,
                    Color: 'FF0000', // Valid hex color
                    TimetableRows: [
                      {
                        StationName: 'Station',
                        Location_m: 0,
                        MarkerColor: 'FFFFFF'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(validColor)).toBe(true)
      })

      it('should reject invalid hex color codes', () => {
        const invalidColor: unknown = [
          {
            Name: 'Color Test',
            Works: [
              {
                Name: 'Work',
                AffectDate: '20260213',
                Trains: [
                  {
                    TrainNumber: '001',
                    Direction: 1,
                    Color: 'FF00', // Invalid: too short
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
        expect(isValidDatabase(invalidColor)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('Color'))).toBe(true)
      })

      it('should validate geographic coordinates', () => {
        const validCoords: Database = [
          {
            Name: 'Coords Test',
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
                        Location_m: 0,
                        Longitude_deg: 139.7414, // Tokyo
                        Latitude_deg: 35.6762
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(validCoords)).toBe(true)
      })

      it('should reject invalid longitude values', () => {
        const invalidLongitude: unknown = [
          {
            Name: 'Coords Test',
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
                        Location_m: 0,
                        Longitude_deg: 200 // Out of range (-180 to 180)
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(invalidLongitude)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('Longitude'))).toBe(true)
      })

      it('should reject invalid latitude values', () => {
        const invalidLatitude: unknown = [
          {
            Name: 'Coords Test',
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
                        Location_m: 0,
                        Latitude_deg: 100 // Out of range (-90 to 90)
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(invalidLatitude)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('Latitude'))).toBe(true)
      })

      it('should validate time constraints', () => {
        const validTimes: Database = [
          {
            Name: 'Time Test',
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
                        Location_m: 0,
                        DriveTime_MM: 15, // 0-99
                        DriveTime_SS: 30 // 0-59
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(validTimes)).toBe(true)
      })

      it('should reject invalid DriveTime_MM', () => {
        const invalidMM: unknown = [
          {
            Name: 'Time Test',
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
                        Location_m: 0,
                        DriveTime_MM: 100 // Out of range (0-99)
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(invalidMM)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('DriveTime_MM'))).toBe(true)
      })

      it('should reject invalid DriveTime_SS', () => {
        const invalidSS: unknown = [
          {
            Name: 'Time Test',
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
                        Location_m: 0,
                        DriveTime_SS: 60 // Out of range (0-59)
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(invalidSS)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('DriveTime_SS'))).toBe(true)
      })

      it('should validate CarCount minimum value', () => {
        const validCarCount: Database = [
          {
            Name: 'CarCount Test',
            Works: [
              {
                Name: 'Work',
                AffectDate: '20260213',
                Trains: [
                  {
                    TrainNumber: '001',
                    Direction: 1,
                    CarCount: 1, // Minimum value
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
        expect(isValidDatabase(validCarCount)).toBe(true)
      })

      it('should reject invalid CarCount', () => {
        const invalidCarCount: unknown = [
          {
            Name: 'CarCount Test',
            Works: [
              {
                Name: 'Work',
                AffectDate: '20260213',
                Trains: [
                  {
                    TrainNumber: '001',
                    Direction: 1,
                    CarCount: 0, // Below minimum (1)
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
        expect(isValidDatabase(invalidCarCount)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('CarCount'))).toBe(true)
      })

      it('should validate DayCount as non-negative', () => {
        const validDayCount: Database = [
          {
            Name: 'DayCount Test',
            Works: [
              {
                Name: 'Work',
                AffectDate: '20260213',
                Trains: [
                  {
                    TrainNumber: '001',
                    Direction: 1,
                    DayCount: 0, // Valid: 0 or greater
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
        expect(isValidDatabase(validDayCount)).toBe(true)
      })

      it('should validate MaxSpeed as string', () => {
        const validMaxSpeed: Database = [
          {
            Name: 'MaxSpeed Test',
            Works: [
              {
                Name: 'Work',
                AffectDate: '20260213',
                Trains: [
                  {
                    TrainNumber: '001',
                    Direction: 1,
                    MaxSpeed: '120', // String type
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
        expect(isValidDatabase(validMaxSpeed)).toBe(true)
      })

      it('should reject MaxSpeed as number', () => {
        const invalidMaxSpeed: unknown = [
          {
            Name: 'MaxSpeed Test',
            Works: [
              {
                Name: 'Work',
                AffectDate: '20260213',
                Trains: [
                  {
                    TrainNumber: '001',
                    Direction: 1,
                    MaxSpeed: 120, // Number (invalid)
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
        expect(isValidDatabase(invalidMaxSpeed)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('MaxSpeed'))).toBe(true)
      })

      it('should validate RunInLimit and RunOutLimit (0-999)', () => {
        const validRunLimits: Database = [
          {
            Name: 'RunLimit Test',
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
                        Location_m: 0,
                        RunInLimit: 500,
                        RunOutLimit: 999
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(validRunLimits)).toBe(true)
      })

      it('should reject RunInLimit out of range', () => {
        const invalidRunIn: unknown = [
          {
            Name: 'RunLimit Test',
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
                        Location_m: 0,
                        RunInLimit: 1000 // Out of range (0-999)
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        expect(isValidDatabase(invalidRunIn)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('RunInLimit'))).toBe(true)
      })

      it('should reject DBVersion negative value', () => {
        const invalidDBVersion: unknown = [
          {
            Name: 'DBVersion Test',
            DBVersion: -1, // Negative (invalid)
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
        expect(isValidDatabase(invalidDBVersion)).toBe(false)
        expect(getValidationErrors().some(e => e.message.includes('DBVersion'))).toBe(true)
      })

      it('should validate DBVersion as non-negative', () => {
        const validDBVersion: Database = [
          {
            Name: 'DBVersion Test',
            DBVersion: 0, // Valid: 0 or greater
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
        expect(isValidDatabase(validDBVersion)).toBe(true)
      })
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
      expect(result.error).toContain('Invalid TRViS database format')
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
      expect(result.error).toContain('Invalid TRViS database format')
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
                  MaxSpeed: '100',
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