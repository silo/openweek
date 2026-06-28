// @vitest-environment nuxt
import type { Board, Task } from '#shared/types/task'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBoardStore } from './board'

const { pushMock, fetchMock } = vi.hoisted(() => ({ pushMock: vi.fn(), fetchMock: vi.fn() }))

// Mock the toast composable + the global $fetch so the store runs in isolation.
mockNuxtImport('useToasts', () => () => ({ push: pushMock, toasts: { value: [] }, remove: () => {} }))
vi.stubGlobal('$fetch', fetchMock)

const board: Board = { id: 'b1', userId: 'u1', name: 'My Week', color: null, position: 'a0', isDefault: true }

function makeTask(over: Partial<Task> = {}): Task {
  return {
    id: 't1',
    boardId: 'b1',
    title: 'Task',
    notes: null,
    date: '2026-06-25',
    listId: null,
    position: 'a0',
    color: null,
    done: false,
    rolledOverFrom: null,
    startTime: null,
    recurrenceRule: null,
    recurrenceId: null,
    parentId: null,
    linkedEventId: null,
    createdAt: 'now',
    updatedAt: 'now',
    ...over,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  pushMock.mockReset()
  fetchMock.mockReset()
})

describe('createTask (optimistic)', () => {
  it('inserts immediately and reconciles with the server row', async () => {
    const store = useBoardStore()
    store.board = board
    // Echo the POST body back as the persisted row (server keeps the client id).
    fetchMock.mockImplementation((_url, opts) =>
      Promise.resolve({ notes: null, done: false, rolledOverFrom: null, createdAt: 'now', updatedAt: 'now', date: null, listId: null, ...opts.body }))

    await store.createTask({ date: '2026-06-25' }, 'Buy milk')

    const tasks = store.tasksForDate('2026-06-25')
    expect(tasks).toHaveLength(1)
    expect(tasks[0]!.title).toBe('Buy milk')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('rolls back and toasts on failure', async () => {
    const store = useBoardStore()
    store.board = board
    fetchMock.mockRejectedValue(new Error('boom'))

    await store.createTask({ date: '2026-06-25' }, 'Doomed')

    expect(store.tasksForDate('2026-06-25')).toHaveLength(0)
    expect(pushMock).toHaveBeenCalledWith(expect.any(String), 'error')
  })
})

describe('toggleDone / patch', () => {
  it('flips done optimistically', async () => {
    const store = useBoardStore()
    store.tasksById = { t1: makeTask({ done: false }) }
    fetchMock.mockResolvedValue(makeTask({ done: true }))

    await store.toggleDone('t1')
    expect(store.tasksById.t1!.done).toBe(true)
  })

  it('rolls back a failed edit', async () => {
    const store = useBoardStore()
    store.tasksById = { t1: makeTask({ title: 'original' }) }
    fetchMock.mockRejectedValue(new Error('nope'))

    await store.setTitle('t1', 'changed')
    expect(store.tasksById.t1!.title).toBe('original')
    expect(pushMock).toHaveBeenCalledWith(expect.any(String), 'error')
  })
})

describe('deleteTask', () => {
  it('removes optimistically and offers undo', async () => {
    const store = useBoardStore()
    store.tasksById = { t1: makeTask() }
    fetchMock.mockResolvedValue({ ok: true })

    await store.deleteTask('t1')
    expect(store.tasksById.t1).toBeUndefined()
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('deleted'), 'info', expect.objectContaining({ label: 'Undo' }))
  })

  it('restores on failure', async () => {
    const store = useBoardStore()
    store.tasksById = { t1: makeTask() }
    fetchMock.mockRejectedValue(new Error('fail'))

    await store.deleteTask('t1')
    expect(store.tasksById.t1).toBeDefined()
    expect(pushMock).toHaveBeenCalledWith(expect.any(String), 'error')
  })
})

describe('moveTask', () => {
  it('moves a task to a new date and clears listId', async () => {
    const store = useBoardStore()
    store.tasksById = { t1: makeTask({ listId: 'l1', date: null }) }
    fetchMock.mockResolvedValue(makeTask({ date: '2026-06-26', listId: null }))

    await store.moveTask('t1', { date: '2026-06-26' }, 'a5')
    expect(store.tasksById.t1!.date).toBe('2026-06-26')
    expect(store.tasksById.t1!.listId).toBeNull()
  })
})

describe('loadWeek', () => {
  it('fetches board, lists and tasks and marks ready', async () => {
    const store = useBoardStore()
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/boards')
        return Promise.resolve([board])
      if (url === '/api/lists')
        return Promise.resolve([{ id: 'l1', boardId: 'b1', name: 'Someday', color: null, position: 'a0' }])
      if (url === '/api/tasks')
        return Promise.resolve([makeTask({ id: 't1' })])
      return Promise.resolve(null)
    })

    await store.loadWeek('2026-06-22', '2026-06-28')
    expect(store.board?.id).toBe('b1')
    expect(store.lists).toHaveLength(1)
    expect(store.ready).toBe(true)
    expect(store.tasksForDate('2026-06-25')).toHaveLength(1)
  })

  it('toasts on load failure', async () => {
    const store = useBoardStore()
    fetchMock.mockRejectedValue(new Error('down'))
    await store.loadWeek('2026-06-22', '2026-06-28')
    expect(pushMock).toHaveBeenCalledWith(expect.any(String), 'error')
  })
})

describe('lists', () => {
  it('creates a list optimistically', async () => {
    const store = useBoardStore()
    store.board = board
    fetchMock.mockImplementation((_url, opts) => Promise.resolve({ ...opts.body, boardId: 'b1' }))
    await store.createList('Ideas')
    expect(store.sortedLists.some(l => l.name === 'Ideas')).toBe(true)
  })

  it('rolls back a failed list creation', async () => {
    const store = useBoardStore()
    store.board = board
    fetchMock.mockRejectedValue(new Error('x'))
    await store.createList('Ideas')
    expect(store.sortedLists).toHaveLength(0)
    expect(pushMock).toHaveBeenCalledWith(expect.any(String), 'error')
  })

  it('renames a list', async () => {
    const store = useBoardStore()
    store.lists = [{ id: 'l1', boardId: 'b1', name: 'Old', color: null, position: 'a0' }]
    fetchMock.mockResolvedValue({ ok: true })
    await store.renameList('l1', 'New')
    expect(store.lists[0]!.name).toBe('New')
  })

  it('deletes a list and its tasks, restoring on failure', async () => {
    const store = useBoardStore()
    store.lists = [{ id: 'l1', boardId: 'b1', name: 'L', color: null, position: 'a0' }]
    store.tasksById = { t1: makeTask({ listId: 'l1', date: null }) }

    fetchMock.mockResolvedValue({ ok: true })
    await store.deleteList('l1')
    expect(store.lists).toHaveLength(0)
    expect(store.tasksById.t1).toBeUndefined()

    // Re-seed and fail → both restored.
    store.lists = [{ id: 'l2', boardId: 'b1', name: 'L2', color: null, position: 'a1' }]
    store.tasksById = { t2: makeTask({ id: 't2', listId: 'l2', date: null }) }
    fetchMock.mockRejectedValue(new Error('x'))
    await store.deleteList('l2')
    expect(store.lists).toHaveLength(1)
    expect(store.tasksById.t2).toBeDefined()
  })
})

describe('rollover', () => {
  it('refetches and toasts when tasks were rolled', async () => {
    const store = useBoardStore()
    store.board = board
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/tasks/rollover')
        return Promise.resolve({ rolled: 2, date: '2026-06-25' })
      if (url === '/api/boards')
        return Promise.resolve([board])
      if (url === '/api/lists')
        return Promise.resolve([])
      if (url === '/api/tasks')
        return Promise.resolve([])
      return Promise.resolve(null)
    })
    const res = await store.rollover('2026-06-22', '2026-06-28')
    expect(res.rolled).toBe(2)
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('Rolled'), 'info')
  })

  it('does nothing when zero rolled', async () => {
    const store = useBoardStore()
    fetchMock.mockResolvedValue({ rolled: 0 })
    const res = await store.rollover('2026-06-22', '2026-06-28')
    expect(res.rolled).toBe(0)
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('swallows rollover errors (best-effort on load)', async () => {
    const store = useBoardStore()
    fetchMock.mockRejectedValue(new Error('x'))
    const res = await store.rollover('2026-06-22', '2026-06-28')
    expect(res.rolled).toBe(0)
  })
})

describe('delete + undo', () => {
  it('restores the task when the undo action runs', async () => {
    const store = useBoardStore()
    store.tasksById = { t1: makeTask() }
    fetchMock.mockResolvedValue({ ok: true })

    await store.deleteTask('t1')
    expect(store.tasksById.t1).toBeUndefined()

    const undo = pushMock.mock.calls.find(c => c[2]?.label === 'Undo')![2]
    fetchMock.mockResolvedValue({ ok: true })
    await undo.run()
    expect(store.tasksById.t1).toBeDefined()
  })
})
