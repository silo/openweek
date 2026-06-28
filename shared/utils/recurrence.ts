import { addDays, getDate, getDay, isAfter, isBefore, parseISO } from 'date-fns'

// Pure task-recurrence helpers (date-only — tasks have no tz/time; ical.js is
// reserved for calendar events). The UI offers a small set of kinds; we store a
// canonical RRULE string (forward-compatible with synced_events).

export const recurrenceKinds = ['daily', 'wkdays', 'weekly', 'monthly'] as const
export type RecurrenceKind = (typeof recurrenceKinds)[number]

const RRULE: Record<RecurrenceKind, string> = {
  daily: 'FREQ=DAILY',
  wkdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  weekly: 'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY',
}

export function ruleToRrule(kind: RecurrenceKind): string {
  return RRULE[kind]
}

/** Best-effort RRULE → kind (for our own canonical strings). */
export function rruleToKind(rule: string | null): RecurrenceKind | null {
  if (!rule)
    return null
  if (/BYDAY=MO,TU,WE,TH,FR/.test(rule))
    return 'wkdays'
  if (/FREQ=DAILY/.test(rule))
    return 'daily'
  if (/FREQ=WEEKLY/.test(rule))
    return 'weekly'
  if (/FREQ=MONTHLY/.test(rule))
    return 'monthly'
  return null
}

/**
 * Occurrence dates (yyyy-MM-dd) of a recurring task within [from, to], inclusive.
 * `templateDate` is the series anchor; occurrences before it are excluded.
 */
export function expandTaskRecurrence(
  templateDate: string,
  rule: string,
  from: string,
  to: string,
): string[] {
  const kind = rruleToKind(rule)
  if (!kind)
    return []

  const anchor = parseISO(templateDate)
  const end = parseISO(to)
  // Never expand before the anchor or the window start.
  let cursor = isBefore(parseISO(from), anchor) ? anchor : parseISO(from)

  const anchorDow = getDay(anchor)
  const anchorDom = getDate(anchor)
  const out: string[] = []

  while (!isAfter(cursor, end)) {
    let hit = false
    switch (kind) {
      case 'daily':
        hit = true
        break
      case 'wkdays':
        hit = getDay(cursor) >= 1 && getDay(cursor) <= 5
        break
      case 'weekly':
        hit = getDay(cursor) === anchorDow
        break
      case 'monthly':
        hit = getDate(cursor) === anchorDom
        break
    }
    if (hit) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      out.push(`${y}-${m}-${d}`)
    }
    cursor = addDays(cursor, 1)
  }
  return out
}
