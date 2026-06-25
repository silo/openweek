import { describe, expect, it } from 'vitest'
import { createTaskInput, listTasksQuery, updateTaskInput } from './task'

const boardId = '019efe4c-f5db-70ea-984a-1f7f3ec8b5e6'
const listId = '019efe4c-f5dd-7eab-9b05-9d3b12978d2e'

describe('createTaskInput', () => {
  it('accepts a date task', () => {
    expect(createTaskInput.safeParse({ boardId, title: 'x', date: '2026-06-25' }).success).toBe(true)
  })
  it('accepts a list task', () => {
    expect(createTaskInput.safeParse({ boardId, title: 'x', listId }).success).toBe(true)
  })
  it('rejects both date and listId (XOR)', () => {
    expect(createTaskInput.safeParse({ boardId, title: 'x', date: '2026-06-25', listId }).success).toBe(false)
  })
  it('rejects neither date nor listId', () => {
    expect(createTaskInput.safeParse({ boardId, title: 'x' }).success).toBe(false)
  })
  it('rejects an empty title', () => {
    expect(createTaskInput.safeParse({ boardId, title: '   ', date: '2026-06-25' }).success).toBe(false)
  })
  it('trims the title', () => {
    const r = createTaskInput.parse({ boardId, title: '  hi  ', date: '2026-06-25' })
    expect(r.title).toBe('hi')
  })
  it('rejects a bad date format', () => {
    expect(createTaskInput.safeParse({ boardId, title: 'x', date: '25-06-2026' }).success).toBe(false)
  })
  it('rejects a bad boardId uuid', () => {
    expect(createTaskInput.safeParse({ boardId: 'nope', title: 'x', date: '2026-06-25' }).success).toBe(false)
  })
  it('rejects an unknown color', () => {
    expect(createTaskInput.safeParse({ boardId, title: 'x', date: '2026-06-25', color: 'orange' }).success).toBe(false)
  })
})

describe('updateTaskInput', () => {
  it('accepts a partial update', () => {
    expect(updateTaskInput.safeParse({ done: true }).success).toBe(true)
  })
  it('accepts nullable notes/color', () => {
    expect(updateTaskInput.safeParse({ notes: null, color: null }).success).toBe(true)
  })
  it('rejects an empty update', () => {
    expect(updateTaskInput.safeParse({}).success).toBe(false)
  })
})

describe('listTasksQuery', () => {
  it('accepts a valid range', () => {
    expect(listTasksQuery.safeParse({ boardId, from: '2026-06-22', to: '2026-06-28' }).success).toBe(true)
  })
  it('rejects a malformed date', () => {
    expect(listTasksQuery.safeParse({ boardId, from: '2026/06/22', to: '2026-06-28' }).success).toBe(false)
  })
})
