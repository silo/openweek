import { describe, expect, it } from 'vitest'
import { expandTaskRecurrence, rruleToKind, ruleToRrule } from './recurrence'

describe('ruleToRrule / rruleToKind', () => {
  it('round-trips each kind', () => {
    for (const kind of ['daily', 'wkdays', 'weekly', 'monthly'] as const)
      expect(rruleToKind(ruleToRrule(kind))).toBe(kind)
  })
  it('returns null for an unknown/empty rule', () => {
    expect(rruleToKind(null)).toBeNull()
    expect(rruleToKind('FREQ=YEARLY')).toBeNull()
  })
})

describe('expandTaskRecurrence', () => {
  // 2026-06-22 is a Monday.
  it('daily fills every day in the window from the anchor', () => {
    const occ = expandTaskRecurrence('2026-06-22', ruleToRrule('daily'), '2026-06-22', '2026-06-25')
    expect(occ).toEqual(['2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25'])
  })
  it('weekly repeats on the anchor weekday', () => {
    const occ = expandTaskRecurrence('2026-06-22', ruleToRrule('weekly'), '2026-06-22', '2026-07-13')
    expect(occ).toEqual(['2026-06-22', '2026-06-29', '2026-07-06', '2026-07-13'])
  })
  it('wkdays skips the weekend', () => {
    const occ = expandTaskRecurrence('2026-06-22', ruleToRrule('wkdays'), '2026-06-26', '2026-06-29')
    expect(occ).toEqual(['2026-06-26', '2026-06-29']) // Fri then Mon (skips Sat/Sun)
  })
  it('monthly repeats on the anchor day-of-month', () => {
    const occ = expandTaskRecurrence('2026-06-15', ruleToRrule('monthly'), '2026-06-01', '2026-08-31')
    expect(occ).toEqual(['2026-06-15', '2026-07-15', '2026-08-15'])
  })
  it('excludes occurrences before the anchor', () => {
    const occ = expandTaskRecurrence('2026-06-24', ruleToRrule('daily'), '2026-06-22', '2026-06-25')
    expect(occ).toEqual(['2026-06-24', '2026-06-25'])
  })
})
