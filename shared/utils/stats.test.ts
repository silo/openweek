import { describe, expect, it } from 'vitest'
import { fillDays, heatLevel, pct, rotateWeekdays, streaks } from './stats'
import { addDaysStr } from './week'

/** `'xx.x'` → four consecutive days, ticked / ticked / empty / ticked. */
function series(spec: string, from = '2026-08-01') {
  return [...spec].map((c, i) => ({ date: addDaysStr(from, i), n: c === 'x' ? 1 : 0 }))
}

describe('fillDays', () => {
  it('zero-fills the gaps and keeps both bounds', () => {
    const filled = fillDays('2026-08-01', '2026-08-04', [
      { date: '2026-08-01', n: 3 },
      { date: '2026-08-04', n: 1 },
    ])
    expect(filled).toEqual([
      { date: '2026-08-01', n: 3 },
      { date: '2026-08-02', n: 0 },
      { date: '2026-08-03', n: 0 },
      { date: '2026-08-04', n: 1 },
    ])
  })

  it('crosses a month boundary', () => {
    expect(fillDays('2026-07-31', '2026-08-01', []).map(d => d.date))
      .toEqual(['2026-07-31', '2026-08-01'])
  })

  it('is empty when the window is inverted', () => {
    expect(fillDays('2026-08-04', '2026-08-01', [])).toEqual([])
  })
})

describe('streaks', () => {
  it('counts the longest run anywhere in the series', () => {
    expect(streaks(series('xx.xxx.x'), '2026-08-08').longest).toBe(3)
  })

  it('counts the current run back from today', () => {
    expect(streaks(series('.xxxx'), '2026-08-05').current).toBe(4)
  })

  // Zeroing the streak at midnight would tell someone they had broken it purely for
  // looking at the page before they had got anything done that day.
  it('does not break the current streak just because today is still empty', () => {
    expect(streaks(series('xxx.'), '2026-08-04').current).toBe(3)
  })

  it('breaks the current streak on a gap that is not today', () => {
    expect(streaks(series('xx..'), '2026-08-04').current).toBe(0)
  })

  it('handles an empty series and a single day', () => {
    expect(streaks([], '2026-08-01')).toEqual({ current: 0, longest: 0 })
    expect(streaks(series('x'), '2026-08-01')).toEqual({ current: 1, longest: 1 })
  })
})

describe('rotateWeekdays', () => {
  const MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  it('leaves a Monday-start week alone', () => {
    expect(rotateWeekdays(MON_FIRST, 1)).toEqual(MON_FIRST)
  })

  it('moves Sunday to the front for a Sunday-start week', () => {
    expect(rotateWeekdays(MON_FIRST, 0)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  })
})

describe('pct', () => {
  it('rounds, and reads an empty denominator as 0 rather than NaN', () => {
    expect(pct(1, 3)).toBe(33)
    expect(pct(0, 0)).toBe(0)
  })
})

describe('heatLevel', () => {
  it('maps nothing to 0 and the busiest day to 4', () => {
    expect(heatLevel(0, 9)).toBe(0)
    expect(heatLevel(9, 9)).toBe(4)
  })

  // A single task on the only active day should still look like activity, not like a trace.
  it('gives a lone completion the top step when that is the whole year', () => {
    expect(heatLevel(1, 1)).toBe(4)
  })

  it('never drops a real completion to the empty step', () => {
    expect(heatLevel(1, 100)).toBe(1)
  })
})
