import type { Board, List, SyncedEventOccurrence, Task, TaskColor } from '#shared/types/task'
import type { RecurrenceKind } from '#shared/utils/recurrence'
import { appendPosition, byPosition } from '#shared/utils/ordering'
import { ruleToRrule } from '#shared/utils/recurrence'
import { defineStore } from 'pinia'
import { uuidv7 } from 'uuidv7'

type Scope = { date: string } | { listId: string }

/** Return a shallow copy of the map without `id` (avoids the `delete` operator). */
function omitKey<T>(map: Record<string, T>, id: string): Record<string, T> {
  const copy = { ...map }
  Reflect.deleteProperty(copy, id)
  return copy
}

/**
 * The single funnel for every task write. Holds a normalized task cache and the
 * board's lists; applies each mutation optimistically and rolls back on error
 * (surfacing a toast). This is what keeps a later PWA/offline mode additive.
 */
export const useBoardStore = defineStore('board', () => {
  const tasksById = ref<Record<string, Task>>({})
  const syncedEvents = ref<SyncedEventOccurrence[]>([])
  const lists = ref<List[]>([])
  const board = ref<Board | null>(null)
  const ready = ref(false)
  const loading = ref(false)
  const currentFrom = ref('')
  const currentTo = ref('')

  const { push } = useToasts()

  // --- getters ---
  const sortedLists = computed(() => [...lists.value].sort((a, b) =>
    a.position !== b.position ? (a.position < b.position ? -1 : 1) : (a.id < b.id ? -1 : 1)))

  function tasksForDate(iso: string): Task[] {
    return Object.values(tasksById.value).filter(t => t.date === iso).sort(byPosition)
  }
  function tasksForList(listId: string): Task[] {
    return Object.values(tasksById.value).filter(t => t.listId === listId).sort(byPosition)
  }

  function scopeItems(scope: Scope): Task[] {
    return 'listId' in scope ? tasksForList(scope.listId) : tasksForDate(scope.date)
  }

  function subtasksOf(parentId: string): Task[] {
    return Object.values(tasksById.value).filter(t => t.parentId === parentId).sort(byPosition)
  }

  function eventsForDate(iso: string): SyncedEventOccurrence[] {
    return syncedEvents.value.filter(e => e.date === iso)
  }

  // --- loading ---
  async function ensureBoard() {
    if (board.value)
      return board.value
    const boards = await $fetch<Board[]>('/api/boards')
    board.value = boards.find(b => b.isDefault) ?? boards[0] ?? null
    if (board.value)
      lists.value = await $fetch<List[]>('/api/lists', { query: { boardId: board.value.id } })
    return board.value
  }

  async function loadWeek(from: string, to: string) {
    loading.value = true
    currentFrom.value = from
    currentTo.value = to
    try {
      const b = await ensureBoard()
      if (!b)
        return
      // Materialize any missing recurring-task instances for this window first.
      await $fetch('/api/tasks/recur', { method: 'POST', body: { boardId: b.id, from, to } }).catch(() => {})
      const rows = await $fetch<Task[]>('/api/tasks', { query: { boardId: b.id, from, to } })
      tasksById.value = Object.fromEntries(rows.map(t => [t.id, t]))
      // Read-only calendar events for the window (empty if no calendars connected).
      syncedEvents.value = await $fetch<SyncedEventOccurrence[]>('/api/sync/events', { query: { boardId: b.id, from, to } }).catch(() => [])
      ready.value = true
    }
    catch {
      push('Could not load your week.', 'error')
    }
    finally {
      loading.value = false
    }
  }

  /** Re-load the currently displayed week (after sync / calendar changes). */
  async function reloadWeek() {
    if (currentFrom.value)
      await loadWeek(currentFrom.value, currentTo.value)
  }

  // --- mutations (optimistic) ---
  async function createTask(scope: Scope, title: string, color: TaskColor | null = null) {
    const b = board.value
    if (!b)
      return
    const id = uuidv7()
    const position = appendPosition(scopeItems(scope))
    const now = new Date().toISOString()
    const optimistic: Task = {
      id,
      boardId: b.id,
      title,
      notes: null,
      date: 'date' in scope ? scope.date : null,
      listId: 'listId' in scope ? scope.listId : null,
      position,
      color,
      done: false,
      rolledOverFrom: null,
      startTime: null,
      recurrenceRule: null,
      recurrenceId: null,
      parentId: null,
      linkedEventId: null,
      createdAt: now,
      updatedAt: now,
    }
    tasksById.value = { ...tasksById.value, [id]: optimistic }

    try {
      const row = await $fetch<Task>('/api/tasks', {
        method: 'POST',
        body: { id, boardId: b.id, title, position, color, ...scope },
      })
      tasksById.value = { ...tasksById.value, [id]: row }
    }
    catch {
      tasksById.value = omitKey(tasksById.value, id)
      push('Could not add task.', 'error')
    }
  }

  async function patchTask(id: string, patch: Partial<Task>) {
    const current = tasksById.value[id]
    if (!current)
      return
    const snapshot = { ...current }
    tasksById.value = { ...tasksById.value, [id]: { ...current, ...patch } }

    try {
      const row = await $fetch<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: patch })
      tasksById.value = { ...tasksById.value, [id]: row }
    }
    catch {
      tasksById.value = { ...tasksById.value, [id]: snapshot }
      push('Could not save change.', 'error')
    }
  }

  const toggleDone = (id: string) => patchTask(id, { done: !tasksById.value[id]?.done })
  const setColor = (id: string, color: TaskColor | null) => patchTask(id, { color })
  const setTitle = (id: string, title: string) => patchTask(id, { title })
  const setNotes = (id: string, notes: string | null) => patchTask(id, { notes })
  const setTime = (id: string, startTime: string | null) => patchTask(id, { startTime })

  /** Set/clear a recurrence kind; re-materializes the visible week on success. */
  async function setRecurrence(id: string, kind: RecurrenceKind | null) {
    const current = tasksById.value[id]
    if (!current)
      return
    const snapshot = { ...current }
    tasksById.value = { ...tasksById.value, [id]: { ...current, recurrenceRule: kind ? ruleToRrule(kind) : null } }
    try {
      const row = await $fetch<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: { recurrence: kind } })
      tasksById.value = { ...tasksById.value, [id]: row }
      if (currentFrom.value)
        await loadWeek(currentFrom.value, currentTo.value)
    }
    catch {
      tasksById.value = { ...tasksById.value, [id]: snapshot }
      push('Could not update repeat.', 'error')
    }
  }

  /** Add a subtask (depth-1) sharing the parent's scope. */
  async function addSubtask(parentId: string, title: string) {
    const parent = tasksById.value[parentId]
    const b = board.value
    if (!parent || parent.parentId || !b)
      return
    const id = uuidv7()
    const position = appendPosition(subtasksOf(parentId))
    const now = new Date().toISOString()
    const scope: Scope = parent.listId != null ? { listId: parent.listId } : { date: parent.date! }
    const optimistic: Task = {
      id,
      boardId: b.id,
      title,
      notes: null,
      date: 'date' in scope ? scope.date : null,
      listId: 'listId' in scope ? scope.listId : null,
      position,
      color: null,
      done: false,
      rolledOverFrom: null,
      startTime: null,
      recurrenceRule: null,
      recurrenceId: null,
      parentId,
      linkedEventId: null,
      createdAt: now,
      updatedAt: now,
    }
    tasksById.value = { ...tasksById.value, [id]: optimistic }
    try {
      const row = await $fetch<Task>('/api/tasks', { method: 'POST', body: { id, boardId: b.id, title, position, parentId, ...scope } })
      tasksById.value = { ...tasksById.value, [id]: row }
    }
    catch {
      tasksById.value = omitKey(tasksById.value, id)
      push('Could not add subtask.', 'error')
    }
  }

  /** Convert a read-only calendar event into a real task (optionally linked). */
  async function convertEvent(occ: SyncedEventOccurrence, keepLinked: boolean) {
    const syncedEventId = occ.id.split(':')[0]!
    try {
      const task = await $fetch<Task>('/api/sync/convert', { method: 'POST', body: { syncedEventId, date: occ.date, keepLinked } })
      tasksById.value = { ...tasksById.value, [task.id]: task }
      push('Event added as a task.', 'success')
    }
    catch {
      push('Could not convert event.', 'error')
    }
  }

  /** Move to a date or list at a given fractional position (Phase 4 DnD / move-menu). */
  function moveTask(id: string, scope: Scope, position: string) {
    const target = 'listId' in scope
      ? { listId: scope.listId, date: null, position }
      : { date: scope.date, listId: null, position }
    return patchTask(id, target)
  }

  async function deleteTask(id: string) {
    const snapshot = tasksById.value[id]
    if (!snapshot)
      return
    tasksById.value = omitKey(tasksById.value, id)

    try {
      await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      push('Task deleted.', 'info', { label: 'Undo', run: () => restoreTask(snapshot) })
    }
    catch {
      tasksById.value = { ...tasksById.value, [id]: snapshot }
      push('Could not delete task.', 'error')
    }
  }

  async function restoreTask(task: Task) {
    tasksById.value = { ...tasksById.value, [task.id]: task }
    try {
      const scope: Scope = task.listId != null ? { listId: task.listId } : { date: task.date! }
      await $fetch('/api/tasks', {
        method: 'POST',
        body: { id: task.id, boardId: task.boardId, title: task.title, position: task.position, color: task.color, notes: task.notes, ...scope },
      })
    }
    catch {
      tasksById.value = omitKey(tasksById.value, task.id)
      push('Could not undo.', 'error')
    }
  }

  // --- lists ---
  async function createList(name: string) {
    const b = board.value
    if (!b)
      return
    const id = uuidv7()
    const position = appendPosition(sortedLists.value)
    const optimistic: List = { id, boardId: b.id, name, color: null, position }
    lists.value = [...lists.value, optimistic]
    try {
      const row = await $fetch<List>('/api/lists', { method: 'POST', body: { id, boardId: b.id, name, position } })
      lists.value = lists.value.map(l => (l.id === id ? row : l))
    }
    catch {
      lists.value = lists.value.filter(l => l.id !== id)
      push('Could not add list.', 'error')
    }
  }

  async function renameList(id: string, name: string) {
    const snapshot = lists.value.find(l => l.id === id)
    if (!snapshot)
      return
    lists.value = lists.value.map(l => (l.id === id ? { ...l, name } : l))
    try {
      await $fetch(`/api/lists/${id}`, { method: 'PATCH', body: { name } })
    }
    catch {
      lists.value = lists.value.map(l => (l.id === id ? snapshot : l))
      push('Could not rename list.', 'error')
    }
  }

  async function deleteList(id: string) {
    const listSnapshot = lists.value.find(l => l.id === id)
    const taskSnapshot = tasksForList(id)
    if (!listSnapshot)
      return
    lists.value = lists.value.filter(l => l.id !== id)
    const removed = new Set(taskSnapshot.map(t => t.id))
    tasksById.value = Object.fromEntries(
      Object.entries(tasksById.value).filter(([key]) => !removed.has(key)),
    )
    try {
      await $fetch(`/api/lists/${id}`, { method: 'DELETE' })
    }
    catch {
      lists.value = [...lists.value, listSnapshot]
      tasksById.value = { ...tasksById.value, ...Object.fromEntries(taskSnapshot.map(t => [t.id, t])) }
      push('Could not delete list.', 'error')
    }
  }

  // --- rollover ---
  async function rollover(from: string, to: string) {
    try {
      const res = await $fetch<{ rolled: number, date?: string }>('/api/tasks/rollover', { method: 'POST' })
      if (res.rolled > 0) {
        await loadWeek(from, to)
        push(`Rolled ${res.rolled} task${res.rolled === 1 ? '' : 's'} to today.`, 'info')
      }
      return res
    }
    catch {
      // Silent: rollover is best-effort on load.
      return { rolled: 0 }
    }
  }

  return {
    tasksById,
    lists,
    board,
    ready,
    loading,
    sortedLists,
    tasksForDate,
    tasksForList,
    subtasksOf,
    syncedEvents,
    eventsForDate,
    convertEvent,
    ensureBoard,
    loadWeek,
    reloadWeek,
    createTask,
    addSubtask,
    toggleDone,
    setColor,
    setTitle,
    setNotes,
    setTime,
    setRecurrence,
    moveTask,
    deleteTask,
    createList,
    renameList,
    deleteList,
    rollover,
  }
})
