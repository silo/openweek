import { describe, expect, it } from 'vitest'
import { isRolledOver } from './task'

describe('isRolledOver', () => {
  it('is true while the task sits later than the day it was written on', () => {
    expect(isRolledOver({ date: '2026-08-19', originalDate: '2026-08-17' })).toBe(true)
  })

  it('is false once it is sent back', () => {
    // Rollover never clears originalDate, so the dates matching is the only signal that
    // the task is home again — the ↻ marker and the review banner both hang off this.
    expect(isRolledOver({ date: '2026-08-17', originalDate: '2026-08-17' })).toBe(false)
  })

  it('is false for a task that never rolled', () => {
    expect(isRolledOver({ date: '2026-08-19', originalDate: null })).toBe(false)
  })

  it('is false for a task in a list, which has no date', () => {
    expect(isRolledOver({ date: null, originalDate: '2026-08-17' })).toBe(false)
  })
})
