import { describe, expect, it } from 'vitest'
import { TEMP_ID_PREFIX, isPending, isRolledOver } from './task'

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

describe('isPending', () => {
  it('is true for the optimistic row a create puts on screen', () => {
    expect(isPending({ id: `${TEMP_ID_PREFIX}3` })).toBe(true)
  })

  it('is false once the server has answered with a real id', () => {
    expect(isPending({ id: '01a01af7-250c-7f27-aa36-e2fa70925f5b' })).toBe(false)
  })
})
