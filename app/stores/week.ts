import { defineStore } from 'pinia'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { List, ListUpdate } from '~~/shared/schemas/list'
import type { Task, TaskUpdate } from '~~/shared/schemas/task'
import type { ListWithTasks, WeekPayload } from '~~/shared/schemas/week'
import type { Container } from '~/composables/useTaskBoard'
import { containerKey } from '~/composables/useTaskBoard'
import { inkForIndex } from '~~/shared/constants/colors'

interface Day { date: string, tasks: Task[], events: CalendarEventDto[] }
let tempCounter = 0

export const useWeekStore = defineStore('week', () => {
  const weekStart = ref('')
  const days = ref<Day[]>([])
  const lists = ref<ListWithTasks[]>([])
  const loading = ref(false)

  /** Ephemeral view state — which day is focused, and which "N done" folds are open. */
  const focusDate = ref<string | null>(null)
  const doneOpen = ref<Record<string, boolean>>({})
  /** Dismissal of the rollover review banner, for this session. */
  const rolloverReviewed = ref(false)
  /** The task currently being dragged, so every container can show a drop line. */
  const draggingId = ref<string | null>(null)

  const doneCount = computed(() => days.value.reduce((n, d) => n + d.tasks.filter(t => t.completedAt).length, 0))
  const totalCount = computed(() => days.value.reduce((n, d) => n + d.tasks.length, 0))
  const weekEmpty = computed(() => totalCount.value === 0)

  /** Tasks that rolled onto today and can still be sent back. */
  const rolledIn = computed(() =>
    days.value.flatMap(d => d.tasks.filter(t => t.originalDate && !t.completedAt)),
  )

  function isFoldOpen(c: Container) {
    return doneOpen.value[containerKey(c)] ?? false
  }
  function toggleFold(c: Container) {
    const k = containerKey(c)
    doneOpen.value = { ...doneOpen.value, [k]: !doneOpen.value[k] }
  }
  function toggleFocus(date: string) {
    focusDate.value = focusDate.value === date ? null : date
  }

  async function loadWeek(start: string) {
    loading.value = true
    try {
      const payload = await apiFetch<WeekPayload>(`/api/week?start=${start}`)
      weekStart.value = payload.weekStart
      days.value = payload.days
      lists.value = payload.lists
    }
    finally {
      loading.value = false
    }
  }

  function bucketFor(c: Container): Task[] | null {
    if ('date' in c) return days.value.find(d => d.date === c.date)?.tasks ?? null
    return lists.value.find(l => l.id === c.listId)?.tasks ?? null
  }
  function buckets(): Task[][] {
    return [...days.value.map(d => d.tasks), ...lists.value.map(l => l.tasks)]
  }
  function locate(id: string): { arr: Task[], index: number } | null {
    for (const arr of buckets()) {
      const index = arr.findIndex(t => t.id === id)
      if (index >= 0) return { arr, index }
    }
    return null
  }
  function find(id: string): Task | undefined {
    const loc = locate(id)
    return loc ? loc.arr[loc.index] : undefined
  }
  /** Which container a task currently sits in — backs the popover's "Move to…". */
  function containerOf(id: string): Container | null {
    const day = days.value.find(d => d.tasks.some(t => t.id === id))
    if (day) return { date: day.date }
    const list = lists.value.find(l => l.tasks.some(t => t.id === id))
    return list ? { listId: list.id } : null
  }

  function tempTask(partial: Partial<Task>): Task {
    return {
      id: `temp-${++tempCounter}`, date: null, listId: null, position: '~', title: '',
      note: null, highlightColor: null, timeOfDay: null, completedAt: null,
      originalDate: null, recurrenceRule: null, sourceEventId: null, sourceLabel: null, ...partial,
    }
  }
  async function insertTask(bucket: Task[], body: Record<string, unknown>, temp: Task) {
    bucket.push(temp)
    try {
      const created = await apiFetch<Task>('/api/tasks', { method: 'POST', body })
      const i = bucket.findIndex(t => t.id === temp.id)
      if (i >= 0) bucket.splice(i, 1, created)
    }
    catch (err) {
      const i = bucket.findIndex(t => t.id === temp.id)
      if (i >= 0) bucket.splice(i, 1)
      throw err
    }
  }

  /** Add a task to a day or a list — the inline composer in both the grid and the rail. */
  function createTask(c: Container, title: string) {
    const bucket = bucketFor(c)
    if (!bucket) return
    const body = 'date' in c ? { title, date: c.date } : { title, listId: c.listId }
    return insertTask(bucket, body, tempTask({ ...c, title }))
  }

  async function updateTask(id: string, patch: TaskUpdate) {
    const t = find(id)
    if (!t) return
    const snapshot = { ...t }
    if (patch.title !== undefined) t.title = patch.title
    if (patch.note !== undefined) t.note = patch.note
    if (patch.highlightColor !== undefined) t.highlightColor = patch.highlightColor
    if (patch.timeOfDay !== undefined) t.timeOfDay = patch.timeOfDay
    if (patch.completed !== undefined) t.completedAt = patch.completed ? new Date().toISOString() : null
    try {
      const updated = await apiFetch<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: patch })
      Object.assign(t, updated)
    }
    catch (err) {
      Object.assign(t, snapshot)
      throw err
    }
  }
  function toggleComplete(id: string) {
    const t = find(id)
    if (t) return updateTask(id, { completed: !t.completedAt })
  }
  async function deleteTask(id: string) {
    const loc = locate(id)
    if (!loc) return
    const [removed] = loc.arr.splice(loc.index, 1)
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' })
    }
    catch (err) {
      if (removed) loc.arr.splice(loc.index, 0, removed)
      throw err
    }
  }

  function targetBody(c: Container) {
    return 'date' in c ? { date: c.date, listId: null } : { listId: c.listId, date: null }
  }

  /** Move a task to a day or a list (the non-drag "Move to…" path). */
  async function moveTask(id: string, dest: Container) {
    return moveRelative(id, dest, null, false)
  }

  /** Reorder / cross-container move: place the task relative to `overTaskId` (or append). */
  async function moveRelative(
    taskId: string,
    dest: Container,
    overTaskId: string | null,
    after: boolean,
  ) {
    const loc = locate(taskId)
    if (!loc) return
    const [t] = loc.arr.splice(loc.index, 1)
    if (!t) return
    const arr = bucketFor(dest)
    if (!arr) {
      try { await apiFetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: targetBody(dest) }) }
      catch (err) { await loadWeek(weekStart.value); throw err }
      return
    }
    let index = arr.length
    if (overTaskId) {
      const oi = arr.findIndex(x => x.id === overTaskId)
      if (oi >= 0) index = after ? oi + 1 : oi
    }
    const position = keyBetween(arr[index - 1]?.position ?? null, arr[index]?.position ?? null)
    arr.splice(index, 0, { ...t, position, ...targetBody(dest) })
    try {
      const updated = await apiFetch<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', body: { ...targetBody(dest), position } })
      const nl = locate(taskId)
      if (nl) nl.arr.splice(nl.index, 1, updated)
    }
    catch (err) {
      await loadWeek(weekStart.value)
      throw err
    }
  }

  /** Send a rolled-over task back where it came from. */
  async function sendBack(id: string) {
    const t = find(id)
    if (!t?.originalDate) return
    return moveTask(id, { date: t.originalDate })
  }

  async function convertEvent(eventId: string, keepLinked: boolean, date?: string) {
    const created = await apiFetch<Task>(`/api/events/${eventId}/convert`, { method: 'POST', body: { keepLinked, date } })
    if (created.date) days.value.find(d => d.date === created.date)?.tasks.push(created)
    return created
  }

  async function createList(name: string) {
    const color = inkForIndex(lists.value.length)
    const created = await apiFetch<List>('/api/lists', { method: 'POST', body: { name, color } })
    lists.value.push({ ...created, tasks: [] })
  }

  async function updateList(id: string, patch: ListUpdate) {
    const l = lists.value.find(x => x.id === id)
    if (!l) return
    const snapshot = { name: l.name, color: l.color }
    Object.assign(l, patch)
    try {
      await apiFetch<List>(`/api/lists/${id}`, { method: 'PATCH', body: patch })
    }
    catch (err) {
      Object.assign(l, snapshot)
      throw err
    }
  }

  async function deleteList(id: string) {
    const i = lists.value.findIndex(l => l.id === id)
    if (i < 0) return
    const [removed] = lists.value.splice(i, 1)
    try {
      await apiFetch(`/api/lists/${id}`, { method: 'DELETE' })
    }
    catch (err) {
      if (removed) lists.value.splice(i, 0, removed)
      throw err
    }
  }

  return {
    weekStart, days, lists, loading,
    focusDate, doneOpen, rolloverReviewed, draggingId,
    doneCount, totalCount, weekEmpty, rolledIn,
    isFoldOpen, toggleFold, toggleFocus,
    loadWeek, find, containerOf, bucketFor, createTask,
    updateTask, toggleComplete, deleteTask, moveTask, moveRelative, sendBack, convertEvent,
    createList, updateList, deleteList,
  }
})
