import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { validateEnv } from './runtime-config'

const valid = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/openweek',
  BETTER_AUTH_SECRET: 'a-secret',
  BETTER_AUTH_URL: 'http://localhost:3000',
  OPENWEEK_ENCRYPTION_KEY: Buffer.alloc(32).toString('base64'),
  NODE_ENV: 'production',
}

describe('validateEnv', () => {
  it('accepts a complete config and applies defaults', () => {
    const env = validateEnv(valid)
    expect(env.DATABASE_URL).toContain('postgres://')
    expect(env.OPENWEEK_SYNC_INTERVAL).toBe('10m') // default
  })

  it('defaults NODE_ENV to development', () => {
    const { NODE_ENV, ...rest } = valid
    void NODE_ENV
    expect(validateEnv(rest).NODE_ENV).toBe('development')
  })

  it('fails fast when a required secret is missing', () => {
    const { BETTER_AUTH_SECRET, ...rest } = valid
    void BETTER_AUTH_SECRET
    expect(() => validateEnv(rest)).toThrow(/BETTER_AUTH_SECRET/)
  })

  it('rejects an encryption key that is not 32 bytes', () => {
    expect(() => validateEnv({ ...valid, OPENWEEK_ENCRYPTION_KEY: 'too-short' }))
      .toThrow(/32 bytes/)
  })

  it('rejects a non-URL BETTER_AUTH_URL', () => {
    expect(() => validateEnv({ ...valid, BETTER_AUTH_URL: 'not-a-url' }))
      .toThrow(/BETTER_AUTH_URL/)
  })

  it('reports multiple problems at once', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL[\s\S]*BETTER_AUTH_SECRET/)
  })
})
