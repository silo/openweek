import { describe, expect, it } from 'vitest'
import { parseConfig } from './config'

const base = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/openweek',
  BETTER_AUTH_SECRET: 's'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
  OPENWEEK_ENCRYPTION_KEY: Buffer.alloc(32).toString('base64'),
}

describe('parseConfig', () => {
  it('parses a valid env and applies defaults', () => {
    const cfg = parseConfig(base)
    expect(cfg.OPENWEEK_SYNC_INTERVAL).toBe('15m')
    expect(cfg.OPENWEEK_EVENT_WINDOW).toBe('-1w..+6w')
  })

  it('rejects an encryption key that is not 32 bytes', () => {
    expect(() => parseConfig({ ...base, OPENWEEK_ENCRYPTION_KEY: 'too-short' })).toThrow(/32 bytes/)
  })

  it('reports a missing required variable by name', () => {
    const { DATABASE_URL: _omit, ...rest } = base
    expect(() => parseConfig(rest)).toThrow(/DATABASE_URL/)
  })
})
