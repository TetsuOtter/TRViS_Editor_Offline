import { describe, it, expect } from 'vitest'
import {
  timeStringToSeconds,
  secondsToTimeString,
  adjustTime,
  timeDiff,
  parseTimeComponents,
  type TimeComponents,
} from './timeUtils'

describe('timeUtils', () => {
  describe('timeStringToSeconds', () => {
    it('should convert valid time strings to seconds', () => {
      expect(timeStringToSeconds('00:00:00')).toBe(0)
      expect(timeStringToSeconds('01:00:00')).toBe(3600)
      expect(timeStringToSeconds('00:01:00')).toBe(60)
      expect(timeStringToSeconds('00:00:01')).toBe(1)
      expect(timeStringToSeconds('12:34:56')).toBe(45296) // 12*3600 + 34*60 + 56
      expect(timeStringToSeconds('23:59:59')).toBe(86399)
    })

    it('should handle single digit hours', () => {
      expect(timeStringToSeconds('1:00:00')).toBe(3600)
      expect(timeStringToSeconds('9:59:59')).toBe(35999)
    })

    it('should return 0 for invalid inputs', () => {
      expect(timeStringToSeconds(null)).toBe(0)
      expect(timeStringToSeconds(undefined)).toBe(0)
      expect(timeStringToSeconds('')).toBe(0)
      expect(timeStringToSeconds('invalid')).toBe(0)
      expect(timeStringToSeconds('12:34')).toBe(0) // Missing seconds
    })

    it('should accept valid time formats even with large values', () => {
      // The current implementation doesn't validate ranges, it just parses
      expect(timeStringToSeconds('25:00:00')).toBe(90000) // 25 hours = 90000 seconds
      expect(timeStringToSeconds('12:60:00')).toBe(46800) // Parsed as 12*3600 + 60*60 + 0
    })
  })

  describe('secondsToTimeString', () => {
    it('should convert seconds to HH:MM:SS format', () => {
      expect(secondsToTimeString(0)).toBe('00:00:00')
      expect(secondsToTimeString(3600)).toBe('01:00:00')
      expect(secondsToTimeString(60)).toBe('00:01:00')
      expect(secondsToTimeString(1)).toBe('00:00:01')
      expect(secondsToTimeString(45296)).toBe('12:34:56') // 12*3600 + 34*60 + 56
      expect(secondsToTimeString(86399)).toBe('23:59:59')
    })

    it('should handle large hour values', () => {
      expect(secondsToTimeString(90000)).toBe('25:00:00') // 25 hours
      expect(secondsToTimeString(360000)).toBe('100:00:00') // 100 hours
    })
  })

  describe('adjustTime', () => {
    it('should adjust time by positive seconds', () => {
      expect(adjustTime('12:00:00', 3600)).toBe('13:00:00')
      expect(adjustTime('12:00:00', 60)).toBe('12:01:00')
      expect(adjustTime('12:00:00', 1)).toBe('12:00:01')
      expect(adjustTime('12:30:45', 75)).toBe('12:32:00') // 12:30:45 + 75 seconds = 12:32:00
    })

    it('should adjust time by negative seconds', () => {
      expect(adjustTime('12:00:00', -3600)).toBe('11:00:00')
      expect(adjustTime('12:00:00', -60)).toBe('11:59:00')
      expect(adjustTime('01:00:00', -3600)).toBe('00:00:00')
    })

    it('should not go below 00:00:00', () => {
      expect(adjustTime('00:30:00', -1800)).toBe('00:00:00')
      expect(adjustTime('12:00:00', -50000)).toBe('00:00:00')
    })

    it('should return null for null/undefined inputs', () => {
      expect(adjustTime(null, 60)).toBe(null)
      expect(adjustTime(undefined, 60)).toBe(null)
      expect(adjustTime('', 60)).toBe(null)
    })
  })

  describe('timeDiff', () => {
    it('should calculate positive time differences', () => {
      expect(timeDiff('12:00:00', '13:00:00')).toBe(3600)
      expect(timeDiff('12:00:00', '12:01:00')).toBe(60)
      expect(timeDiff('12:00:00', '12:00:01')).toBe(1)
      expect(timeDiff('12:00:00', '12:30:45')).toBe(1845)
    })

    it('should calculate negative time differences', () => {
      expect(timeDiff('13:00:00', '12:00:00')).toBe(-3600)
      expect(timeDiff('12:01:00', '12:00:00')).toBe(-60)
      expect(timeDiff('12:00:01', '12:00:00')).toBe(-1)
    })

    it('should return 0 for same times', () => {
      expect(timeDiff('12:00:00', '12:00:00')).toBe(0)
    })

    it('should return 0 for null/undefined inputs', () => {
      expect(timeDiff(null, '12:00:00')).toBe(0)
      expect(timeDiff('12:00:00', null)).toBe(0)
      expect(timeDiff(null, null)).toBe(0)
      expect(timeDiff(undefined, undefined)).toBe(0)
    })
  })

  describe('parseTimeComponents', () => {
    it('should parse time string into components', () => {
      const result: TimeComponents = parseTimeComponents('12:34:56')
      expect(result.hours).toBe(12)
      expect(result.minutes).toBe(34)
      expect(result.seconds).toBe(56)
    })

    it('should handle edge cases', () => {
      const midnight: TimeComponents = parseTimeComponents('00:00:00')
      expect(midnight.hours).toBe(0)
      expect(midnight.minutes).toBe(0)
      expect(midnight.seconds).toBe(0)

      const endOfDay: TimeComponents = parseTimeComponents('23:59:59')
      expect(endOfDay.hours).toBe(23)
      expect(endOfDay.minutes).toBe(59)
      expect(endOfDay.seconds).toBe(59)
    })

    it('should handle large hour values', () => {
      const largeHours: TimeComponents = parseTimeComponents('25:30:45')
      expect(largeHours.hours).toBe(25)
      expect(largeHours.minutes).toBe(30)
      expect(largeHours.seconds).toBe(45)
    })

    it('should return zero components for invalid inputs', () => {
      const nullResult: TimeComponents = parseTimeComponents(null)
      expect(nullResult.hours).toBe(0)
      expect(nullResult.minutes).toBe(0)
      expect(nullResult.seconds).toBe(0)

      const undefinedResult: TimeComponents = parseTimeComponents(undefined)
      expect(undefinedResult.hours).toBe(0)
      expect(undefinedResult.minutes).toBe(0)
      expect(undefinedResult.seconds).toBe(0)
    })
  })

  describe('integration tests', () => {
    it('should be reversible: timeStringToSeconds <-> secondsToTimeString', () => {
      const testCases = ['00:00:00', '12:34:56', '23:59:59', '01:00:00']

      testCases.forEach(timeString => {
        const seconds = timeStringToSeconds(timeString)
        const converted = secondsToTimeString(seconds)
        expect(converted).toBe(timeString)
      })
    })

    it('should handle time adjustments correctly', () => {
      // Add 1 hour and 30 minutes
      const result = adjustTime('10:15:30', 5430) // 1.5 hours = 5430 seconds
      expect(result).toBe('11:46:00') // 10:15:30 + 90:30 = 11:46:00
    })

    it('should calculate journey time correctly', () => {
      const departureTime = '06:00:00'
      const arrivalTime = '06:47:30'
      const journeyTimeSeconds = timeDiff(departureTime, arrivalTime)

      expect(journeyTimeSeconds).toBe(2850) // 47.5 minutes = 2850 seconds

      const journeyTimeString = secondsToTimeString(journeyTimeSeconds)
      expect(journeyTimeString).toBe('00:47:30')
    })
  })
})