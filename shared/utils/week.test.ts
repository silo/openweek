import { describe, expect, it } from 'vitest'
import { addDaysStr, eachDay, isPastDate, startOfWeekStr } from './week'

describe('addDaysStr', () => {
  it('moves forward and back across a month boundary', () => {
    expect(addDaysStr('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDaysStr('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('handles a leap day', () => {
    expect(addDaysStr('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('eachDay', () => {
  it('returns seven consecutive dates', () => {
    expect(eachDay('2026-08-17')).toEqual([
      '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20',
      '2026-08-21', '2026-08-22', '2026-08-23',
    ])
  })
})

describe('startOfWeekStr', () => {
  it('honours the week-start setting', () => {
    // 2026-08-19 is a Wednesday.
    expect(startOfWeekStr('2026-08-19', 1)).toBe('2026-08-17')
    expect(startOfWeekStr('2026-08-19', 0)).toBe('2026-08-16')
  })
})

describe('isPastDate', () => {
  it('is false for today and every day after it', () => {
    expect(isPastDate('2026-08-19', '2026-08-19')).toBe(false)
    expect(isPastDate('2026-08-20', '2026-08-19')).toBe(false)
    expect(isPastDate('2027-01-01', '2026-08-19')).toBe(false)
  })

  it('is true for yesterday and earlier, across month and year ends', () => {
    expect(isPastDate('2026-08-18', '2026-08-19')).toBe(true)
    expect(isPastDate('2026-07-31', '2026-08-01')).toBe(true)
    expect(isPastDate('2025-12-31', '2026-01-01')).toBe(true)
  })
})
