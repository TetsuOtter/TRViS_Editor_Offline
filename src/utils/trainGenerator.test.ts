import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTimetableFromPattern, validatePatternForLine } from './trainGenerator'
import { mockStations, mockLine, mockTrainTypePattern } from '../test/fixtures'
import type { TrainTypePattern, Line } from '../types/editor'

// Mock crypto.getRandomValues for consistent IDs in tests
const mockGetRandomValues = vi.fn()
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
  },
})

describe('trainGenerator', () => {
  beforeEach(() => {
    mockGetRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]))
  })

  describe('generateTimetableFromPattern', () => {
    it('should generate timetable rows for a complete pattern', () => {
      const departureTime = '06:00:00'
      const result = generateTimetableFromPattern(
        mockTrainTypePattern,
        departureTime,
        mockLine,
        mockStations
      )

      expect(result).toHaveLength(3) // 3 stations

      // First station (departure only)
      expect(result[0].StationName).toBe('東京')
      expect(result[0].Departure).toBe('06:00:00')
      expect(result[0].Arrive).toBeUndefined()

      // Second station (arrival and departure)
      expect(result[1].StationName).toBe('新橋')
      expect(result[1].Arrive).toBe('06:03:00') // 3 minutes (MM=3, SS=0)
      expect(result[1].Departure).toBe('06:03:30') // +30 seconds dwell time

      // Third station (arrival only)
      expect(result[2].StationName).toBe('品川')
      expect(result[2].Arrive).toBe('06:07:30') // +4 minutes from previous departure
      expect(result[2].Departure).toBeUndefined() // Terminal station
    })

    it('should handle missing stations gracefully', () => {
      const incompleteStations = [mockStations[0], mockStations[2]] // Only Tokyo (st-1) and Shinbashi (st-3)
      const result = generateTimetableFromPattern(
        mockTrainTypePattern,
        '06:00:00',
        mockLine,
        incompleteStations
      )

      expect(result).toHaveLength(2) // Only 2 stations found
      expect(result[0].StationName).toBe('東京')   // st-1 first in line
      expect(result[1].StationName).toBe('新橋')   // st-3 second in line
    })

    it('should handle empty line', () => {
      const emptyLine: Line = {
        ...mockLine,
        stations: []
      }

      const result = generateTimetableFromPattern(
        mockTrainTypePattern,
        '06:00:00',
        emptyLine,
        mockStations
      )

      expect(result).toHaveLength(0)
    })

    it('should handle missing intervals with default timing', () => {
      const incompletePattern: TrainTypePattern = {
        ...mockTrainTypePattern,
        intervals: [
          // Only first interval, missing second one
          { fromStationId: 'st-1', toStationId: 'st-3', driveTime_MM: 3, driveTime_SS: 0 }
        ]
      }

      const result = generateTimetableFromPattern(
        incompletePattern,
        '06:00:00',
        mockLine,
        mockStations
      )

      expect(result).toHaveLength(3)
      expect(result[1].Arrive).toBe('06:03:00') // Uses pattern interval
      expect(result[2].Arrive).toBe('06:06:30') // Uses default 3 minutes + 30s dwell
    })

    it('should handle different departure times', () => {
      const result1 = generateTimetableFromPattern(
        mockTrainTypePattern,
        '12:30:45',
        mockLine,
        mockStations
      )

      expect(result1[0].Departure).toBe('12:30:45')
      expect(result1[1].Arrive).toBe('12:33:45') // +3 minutes
      expect(result1[2].Arrive).toBe('12:38:15') // +4 minutes from previous departure (12:34:15)
    })

    it('should set location data correctly', () => {
      const result = generateTimetableFromPattern(
        mockTrainTypePattern,
        '06:00:00',
        mockLine,
        mockStations
      )

      expect(result[0].Location_m).toBe(0) // First station
      expect(result[1].Location_m).toBe(2800) // Distance to second station
      expect(result[2].Location_m).toBe(6800) // Distance to third station
    })

    it('should include station metadata', () => {
      const result = generateTimetableFromPattern(
        mockTrainTypePattern,
        '06:00:00',
        mockLine,
        mockStations
      )

      expect(result[0].FullName).toBe('東京駅')
      expect(result[1].FullName).toBe('新橋駅')
      expect(result[2].FullName).toBe('品川駅')
    })
  })

  describe('validatePatternForLine', () => {
    it('should validate complete pattern', () => {
      const result = validatePatternForLine(mockTrainTypePattern, mockLine)

      expect(result.valid).toBe(true)
      expect(result.missingIntervals).toHaveLength(0)
    })

    it('should identify missing intervals', () => {
      const incompletePattern: TrainTypePattern = {
        ...mockTrainTypePattern,
        intervals: [
          // Missing second interval: st-3 → st-2
          { fromStationId: 'st-1', toStationId: 'st-3', driveTime_MM: 3, driveTime_SS: 0 }
        ]
      }

      const result = validatePatternForLine(incompletePattern, mockLine)

      expect(result.valid).toBe(false)
      expect(result.missingIntervals).toHaveLength(1)
      expect(result.missingIntervals[0]).toBe('st-3 → st-2')
    })

    it('should handle empty pattern', () => {
      const emptyPattern: TrainTypePattern = {
        ...mockTrainTypePattern,
        intervals: []
      }

      const result = validatePatternForLine(emptyPattern, mockLine)

      expect(result.valid).toBe(false)
      expect(result.missingIntervals).toHaveLength(2) // All intervals missing
    })

    it('should handle single station line', () => {
      const singleStationLine: Line = {
        ...mockLine,
        stations: [mockLine.stations[0]] // Only one station
      }

      const result = validatePatternForLine(mockTrainTypePattern, singleStationLine)

      expect(result.valid).toBe(true) // No intervals needed
      expect(result.missingIntervals).toHaveLength(0)
    })

    it('should handle extra intervals that are not needed', () => {
      const extraPattern: TrainTypePattern = {
        ...mockTrainTypePattern,
        intervals: [
          ...mockTrainTypePattern.intervals,
          { fromStationId: 'st-4', toStationId: 'st-5', driveTime_MM: 5, driveTime_SS: 0 } // Extra interval
        ]
      }

      const result = validatePatternForLine(extraPattern, mockLine)

      expect(result.valid).toBe(true) // Extra intervals don't affect validation
      expect(result.missingIntervals).toHaveLength(0)
    })
  })

  describe('integration tests', () => {
    it('should work with real-world timing', () => {
      // Create a more realistic pattern with different timings
      const realisticPattern: TrainTypePattern = {
        id: 'realistic-pattern',
        typeName: 'Express Pattern',
        lineId: mockLine.id,
        intervals: [
          { fromStationId: 'st-1', toStationId: 'st-3', driveTime_MM: 2, driveTime_SS: 0 }, // 2 minutes (express)
          { fromStationId: 'st-3', toStationId: 'st-2', driveTime_MM: 5, driveTime_SS: 0 }, // 5 minutes
        ]
      }

      const result = generateTimetableFromPattern(
        realisticPattern,
        '07:30:00',
        mockLine,
        mockStations
      )

      expect(result[0].Departure).toBe('07:30:00')
      expect(result[1].Arrive).toBe('07:32:00') // +2 minutes
      expect(result[1].Departure).toBe('07:32:30') // +30s dwell
      expect(result[2].Arrive).toBe('07:37:30') // +5 minutes from departure
    })

    it('should validate and generate consistently', () => {
      // First validate the pattern
      const validation = validatePatternForLine(mockTrainTypePattern, mockLine)
      expect(validation.valid).toBe(true)

      // Then generate timetable
      const timetable = generateTimetableFromPattern(
        mockTrainTypePattern,
        '06:00:00',
        mockLine,
        mockStations
      )

      // Should generate complete timetable for valid pattern
      expect(timetable).toHaveLength(mockLine.stations.length)
      expect(timetable.every(row => row.StationName)).toBe(true)
    })
  })
})