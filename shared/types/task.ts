// Plain client/server-shared types. NO drizzle/Vue/Nitro imports (see
// docs/architecture.md — keeps the DB layer out of the client bundle).

export const TASK_COLORS = ['yellow', 'pink', 'blue', 'green'] as const
export type TaskColor = (typeof TASK_COLORS)[number]

/** A task as returned by the API (serialized row). */
export interface Task {
  id: string
  boardId: string
  title: string
  notes: string | null
  date: string | null // yyyy-MM-dd (day column) — null ⇒ lives in a list
  listId: string | null // null ⇒ lives on a date
  position: string // fractional index within its day or list
  color: TaskColor | null
  done: boolean
  rolledOverFrom: string | null
  createdAt: string
  updatedAt: string
}

export interface List {
  id: string
  boardId: string
  name: string
  position: string
}

export interface Board {
  id: string
  userId: string
  name: string
  color: string | null
  position: string
  isDefault: boolean
}
