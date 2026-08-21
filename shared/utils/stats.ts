// Pure helpers behind the Stats page. The SQL does the aggregating and returns sparse rows;
// everything that is plain arithmetic lives here so it can be tested without a database.

import type { DayCount } from '../schemas/stats'
import { addDaysStr } from './week'

/**
 * Expand a sparse `(date, count)` series into every day from `from` to `to` inclusive.
 * The heatmap needs a cell per day, and the streak walk has to be able to see the holes.
 * ISO dates compare correctly as strings, so the walk is a plain loop.
 */
export function fillDays(from: string, to: string, rows: DayCount[]): DayCount[] {
  const counts = new Map(rows.map(r => [r.date, r.n]))
  const out: DayCount[] = []
  for (let d = from; d <= to; d = addDaysStr(d, 1)) {
    out.push({ date: d, n: counts.get(d) ?? 0 })
  }
  return out
}

/**
 * Runs of consecutive days with at least one completion. `days` must be dense and ascending
 * — i.e. straight out of `fillDays`.
 *
 * The current streak is allowed to end *yesterday*. Someone who has not ticked anything yet
 * today has not broken anything, and resetting the count at every midnight would read as a
 * reprimand for looking early in the day.
 */
export function streaks(days: DayCount[], today: string): { current: number, longest: number } {
  let longest = 0
  let run = 0
  for (const d of days) {
    run = d.n > 0 ? run + 1 : 0
    if (run > longest) longest = run
  }

  let current = 0
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i]!
    if (d.n > 0) {
      current++
      continue
    }
    // An empty day is forgiven only when it is today itself, and only before any day has counted.
    if (d.date === today && current === 0) continue
    break
  }

  return { current, longest }
}

/**
 * Reorder a Monday-first row (Postgres `isodow`, 1–7) to start on the account's first day of
 * the week. Only Sunday-start actually moves anything, but taking the setting keeps that
 * knowledge out of every caller.
 */
export function rotateWeekdays<T>(mondayFirst: readonly T[], weekStartsOn: 0 | 1): T[] {
  const offset = weekStartsOn === 1 ? 0 : 6
  return mondayFirst.map((_, i) => mondayFirst[(i + offset) % mondayFirst.length]!)
}

/** A rounded percentage, with the empty case reading as 0 rather than NaN. */
export function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

/**
 * Bucket a day's count into one of five intensity steps for the heatmap. Scaled against the
 * account's own busiest day rather than an absolute number, so a quiet year still reads as a
 * gradient instead of a flat wash.
 */
export function heatLevel(n: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0) return 0
  if (max <= 1) return 4
  return Math.min(4, Math.max(1, Math.ceil((n / max) * 4))) as 1 | 2 | 3 | 4
}
