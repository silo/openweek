import { describe, expect, it } from 'vitest'
import { nextSyncMode, shouldResyncOnError } from './sync-cursor'

describe('nextSyncMode', () => {
  it('does a full resync when no cursor is stored', () => {
    expect(nextSyncMode(null)).toBe('full')
    expect(nextSyncMode(undefined)).toBe('full')
    expect(nextSyncMode('')).toBe('full')
  })
  it('goes incremental when a cursor exists', () => {
    expect(nextSyncMode('token-123')).toBe('incremental')
  })
})

describe('shouldResyncOnError', () => {
  it('resyncs on Google 410 Gone', () => {
    expect(shouldResyncOnError(410)).toBe(true)
  })
  it('resyncs on CalDAV 412 / invalid sync token', () => {
    expect(shouldResyncOnError(412)).toBe(true)
    expect(shouldResyncOnError(400, 'Invalid sync token')).toBe(true)
    expect(shouldResyncOnError(null, 'the syncToken is no longer valid')).toBe(true)
  })
  it('does not resync on unrelated errors', () => {
    expect(shouldResyncOnError(500)).toBe(false)
    expect(shouldResyncOnError(401, 'unauthorized')).toBe(false)
  })
})
