import { describe, expect, it } from 'vitest'
import { createListInput, updateListInput } from './list'

const boardId = '019efe4c-f5db-70ea-984a-1f7f3ec8b5e6'

describe('createListInput', () => {
  it('accepts a valid list', () => {
    expect(createListInput.safeParse({ boardId, name: 'Someday' }).success).toBe(true)
  })
  it('trims and rejects an empty name', () => {
    expect(createListInput.safeParse({ boardId, name: '   ' }).success).toBe(false)
  })
  it('rejects a bad boardId', () => {
    expect(createListInput.safeParse({ boardId: 'x', name: 'A' }).success).toBe(false)
  })
  it('accepts an optional color', () => {
    expect(createListInput.safeParse({ boardId, name: 'Work', color: '#CFDEEA' }).success).toBe(true)
  })
})

describe('updateListInput', () => {
  it('accepts a rename', () => {
    expect(updateListInput.safeParse({ name: 'Renamed' }).success).toBe(true)
  })
  it('rejects an empty update', () => {
    expect(updateListInput.safeParse({}).success).toBe(false)
  })
})
