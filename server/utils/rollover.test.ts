import { describe, expect, it } from 'vitest'
import { localDay, shouldRollover } from './rollover'

describe('localDay', () => {
  const instant = new Date('2026-06-25T23:30:00Z') // late on the 25th UTC

  it('uses UTC when given UTC', () => {
    expect(localDay(instant, 'UTC')).toBe('2026-06-25')
  })
  it('rolls into the next day for Asia/Tokyo (UTC+9)', () => {
    expect(localDay(instant, 'Asia/Tokyo')).toBe('2026-06-26')
  })
  it('stays on the same day for America/New_York (UTC-4 in June)', () => {
    expect(localDay(instant, 'America/New_York')).toBe('2026-06-25')
  })
  it('falls back to UTC for a null timezone', () => {
    expect(localDay(instant, null)).toBe('2026-06-25')
  })
})

describe('shouldRollover (idempotency gate)', () => {
  const today = '2026-06-25'

  it('runs when enabled and not yet run today', () => {
    expect(shouldRollover({ enabled: true, lastRolloverDate: '2026-06-24', today })).toBe(true)
  })
  it('runs when enabled and never run before', () => {
    expect(shouldRollover({ enabled: true, lastRolloverDate: null, today })).toBe(true)
  })
  it('is a no-op when already run today (idempotent)', () => {
    expect(shouldRollover({ enabled: true, lastRolloverDate: today, today })).toBe(false)
  })
  it('never runs when disabled', () => {
    expect(shouldRollover({ enabled: false, lastRolloverDate: null, today })).toBe(false)
  })
})
