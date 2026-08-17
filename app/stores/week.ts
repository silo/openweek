import { defineStore } from 'pinia'
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { List } from '~~/shared/schemas/list'
import type { Task, TaskUpdate } from '~~/shared/schemas/task'
import type { WeekPayload } from '~~/shared/schemas/week'

interface Day { date: string, tasks: Task[], events: CalendarEventDto[] }
let tempCounter = 0

export const useWeekStore = defineStore('week', () => {
  const weekStart = ref('')
  const days = ref<Day[]>([])
  const lists = ref<List[]>([])
  const activeListId = ref<string | null>(null)
  const listTasks = ref<Task[]>([])
  const loading = ref(false)

  const activeList = computed(() => lists.value.find(l => l.id === activeListId.value) ?? null)
  const doneCount = computed(() => days.value.reduce((n, d) => n + d.tasks.filter(t => t.completedAt).length, 0))
  const totalCount = computed(() => days.value.reduce((n, d) => n + d.tasks.length, 0))

  async function loadWeek(start: string) {
    loading.value = true
    try {
      const payload = await apiFetch<WeekPayload>(`/api/week?start=${start}`)
      weekStart.value = payload.weekStart
      days.value = payload.days
      lists.value = payload.lists
      if (lists.value.length && !lists.value.some(l => l.id === activeListId.value)) {
        await loadList(lists.value[0]!.id)
      }
    }
    finally {
      loading.value = false
    }
  }

  async function loadList(id: string) {
    const res = await apiFetch<{ list: List, tasks: Task[] }>(`/api/lists/${id}`)
    activeListId.value = res.list.id
    listTasks.value = res.tasks
  }

  function buckets(): Task[][] {
    return [...days.value.map(d => d.tasks), listTasks.value]
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

  function createTask(date: string, title: string) {
    const day = days.value.find(d => d.date === date)
    if (!day) return
    return insertTask(day.tasks, { title, date }, tempTask({ date, title }))
  }
  function createTaskInList(listId: string, title: string) {
    return insertTask(listTasks.value, { title, listId }, tempTask({ listId, title }))
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

  /** Move a task to a day or a list (the non-drag "Move to…" path). */
  async function moveTask(id: string, target: { date: string } | { listId: string }) {
    const loc = locate(id)
    if (!loc) return
    const [t] = loc.arr.splice(loc.index, 1)
    if (!t) return
    if ('date' in target) {
      days.value.find(d => d.date === target.date)?.tasks.push({ ...t, date: target.date, listId: null })
    }
    else if (target.listId === activeListId.value) {
      listTasks.value.push({ ...t, listId: target.listId, date: null })
    }
    try {
      const updated = await apiFetch<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: target })
      const nl = locate(id)
      if (nl) nl.arr.splice(nl.index, 1, updated)
    }
    catch (err) {
      await loadWeek(weekStart.value)
      if (activeListId.value) await loadList(activeListId.value)
      throw err
    }
  }

  function destArray(dest: { date: string } | { listId: string }): Task[] | null {
    if ('date' in dest) return days.value.find(d => d.date === dest.date)?.tasks ?? null
    return dest.listId === activeListId.value ? listTasks.value : null
  }

  /** Reorder / cross-bucket move from a drag-drop: place the task relative to `overTaskId` (or append). */
  async function moveRelative(
    taskId: string,
    dest: { date: string } | { listId: string },
    overTaskId: string | null,
    after: boolean,
  ) {
    const loc = locate(taskId)
    if (!loc) return
    const [t] = loc.arr.splice(loc.index, 1)
    if (!t) return
    const arr = destArray(dest)
    if (!arr) {
      try { await apiFetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: dest }) }
      catch (err) { await loadWeek(weekStart.value); throw err }
      return
    }
    let index = arr.length
    if (overTaskId) {
      const oi = arr.findIndex(x => x.id === overTaskId)
      if (oi >= 0) index = after ? oi + 1 : oi
    }
    const position = keyBetween(arr[index - 1]?.position ?? null, arr[index]?.position ?? null)
    arr.splice(index, 0, {
      ...t,
      position,
      date: 'date' in dest ? dest.date : null,
      listId: 'listId' in dest ? dest.listId : null,
    })
    try {
      const updated = await apiFetch<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', body: { ...dest, position } })
      const nl = locate(taskId)
      if (nl) nl.arr.splice(nl.index, 1, updated)
    }
    catch (err) {
      await loadWeek(weekStart.value)
      if (activeListId.value) await loadList(activeListId.value)
      throw err
    }
  }

  async function convertEvent(eventId: string, keepLinked: boolean, date?: string) {
    const created = await apiFetch<Task>(`/api/events/${eventId}/convert`, { method: 'POST', body: { keepLinked, date } })
    if (created.date) days.value.find(d => d.date === created.date)?.tasks.push(created)
    return created
  }

  async function createList(name: string) {
    const created = await apiFetch<List>('/api/lists', { method: 'POST', body: { name } })
    lists.value.push(created)
    await loadList(created.id)
  }

  return {
    weekStart, days, lists, activeListId, listTasks, loading,
    activeList, doneCount, totalCount,
    loadWeek, loadList, find, createTask, createTaskInList,
    updateTask, toggleComplete, deleteTask, moveTask, moveRelative, convertEvent, createList,
  }
})
