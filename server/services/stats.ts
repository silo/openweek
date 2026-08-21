import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../database/client'
import { list, task, userSettings } from '../database/schema'
import type { NamedBucket, StatsPayload, StatsRange, StatsScope, StatsSummary } from '~~/shared/schemas/stats'
import { STATS_RANGE_DAYS, STATS_TREND } from '~~/shared/schemas/stats'
import { HIGHLIGHT_INKS, INK_LABELS } from '~~/shared/constants/colors'
import { fillDays, rotateWeekdays, streaks } from '~~/shared/utils/stats'
import { addDaysStr, eachDay, startOfWeekStr, todayInTz } from '~~/shared/utils/week'

// --- the three definitions the whole page rests on --------------------------------------
//
// `completed_at` is stamped in server UTC (see tasks/[id].patch.ts), while every day-bucket
// decision in this app goes through the account's timezone. Getting that conversion wrong
// misfiles every late-evening completion by a day, so it lives in one place here.

/**
 * The instant a local day begins in `tz`. Bounds on `completed_at` are written against this
 * rather than against a converted column, so the filter stays sargable and can still use
 * `task_user_completed_idx`.
 */
const dayStart = (day: string, tz: string) => sql`(${day}::date)::timestamp AT TIME ZONE ${tz}`

/** The local calendar day a completion actually landed on. */
const localDay = (tz: string) => sql`(${task.completedAt} AT TIME ZONE ${tz})::date`

/**
 * The day a task was *first* planned for — not the day it currently sits on.
 *
 * Rollover moves `date` forward and stores the pre-roll day in `original_date` once, on the
 * first move. Bucketing on `date` would therefore let every unfinished day quietly empty
 * itself out and report 100% done. `original_date` is null when nothing ever rolled, so the
 * coalesce is correct for rollover-on and rollover-off accounts alike. It is also null for
 * list tasks (both columns null), which is what keeps them out of day-based windows.
 */
const plannedDay = sql`coalesce(${task.originalDate}, ${task.date})`

/** Completions that fall inside `[from, to]` of the account's local calendar, inclusive. */
const completedWithin = (from: string, to: string, tz: string) =>
  sql`${task.completedAt} >= ${dayStart(from, tz)} and ${task.completedAt} < ${dayStart(addDaysStr(to, 1), tz)}`

/** Planned into the window, or ticked inside it — the population for the composition splits. */
const touchesWindow = (from: string, to: string, tz: string) =>
  sql`(${plannedDay} between ${from}::date and ${to}::date
    or (${task.completedAt} is not null and ${completedWithin(from, to, tz)}))`

const isoDate = (expr: ReturnType<typeof sql>) => sql<string>`to_char(${expr}, 'YYYY-MM-DD')`

const HEATMAP_DAYS = 365

export interface StatsOptions {
  range: StatsRange
  scope: StatsScope
}

export async function statsForUser(userId: string, opts: StatsOptions): Promise<StatsSummary | StatsPayload> {
  const [settings] = await db.select({
    timezone: userSettings.timezone,
    weekStartsOn: userSettings.weekStartsOn,
  }).from(userSettings).where(eq(userSettings.userId, userId))

  const tz = settings?.timezone ?? 'UTC'
  const weekStartsOn = (settings?.weekStartsOn === 0 ? 0 : 1) as 0 | 1

  const today = todayInTz(tz)
  const from = addDaysStr(today, -(STATS_RANGE_DAYS[opts.range] - 1))
  // Follow-through stops at yesterday: a task planned for today is not late yet, and counting
  // it as a miss would make the number read worst first thing in the morning.
  const lastFullDay = addDaysStr(today, -1)
  const yearFrom = addDaysStr(today, -(HEATMAP_DAYS - 1))
  const trend = STATS_TREND[opts.range]
  const trendFrom = trend.unit === 'week'
    ? startOfWeekStr(addDaysStr(today, -7 * (trend.count - 1)), weekStartsOn)
    : addDaysStr(today, -(trend.count - 1))

  const scoped = (extra: ReturnType<typeof sql>) => and(eq(task.userId, userId), extra)

  // The year of daily counts is needed even for the summary, because both streaks are walked
  // from it. Only the array itself is withheld from the grid strip.
  const dailyQuery = db.select({
    date: isoDate(localDay(tz)),
    n: sql<number>`count(*)::int`,
  }).from(task)
    .where(scoped(sql`${task.completedAt} is not null and ${completedWithin(yearFrom, today, tz)}`))
    .groupBy(sql`1`)

  // Follow-through, its early/on-the-day/late split, and the median slip all fall out of one
  // pass over the same population, so they are asked for together.
  const followThroughQuery = db.select({
    planned: sql<number>`count(*)::int`,
    closed: sql<number>`count(${task.completedAt})::int`,
    early: sql<number>`count(*) filter (where ${localDay(tz)} < ${plannedDay})::int`,
    onTheDay: sql<number>`count(*) filter (where ${localDay(tz)} = ${plannedDay})::int`,
    late: sql<number>`count(*) filter (where ${localDay(tz)} > ${plannedDay})::int`,
    medianSlipDays: sql<number | null>`percentile_cont(0.5) within group (
      order by (${localDay(tz)} - ${plannedDay})::float8)`,
    rolled: sql<number>`count(*) filter (
      where ${task.originalDate} is not null and ${task.originalDate} < ${task.date})::int`,
  }).from(task)
    .where(scoped(sql`${plannedDay} between ${from}::date and ${lastFullDay}::date`))

  if (opts.scope === 'summary') {
    const [daily, [reach]] = await Promise.all([dailyQuery, followThroughQuery])
    return summary(opts.range, from, today, tz, daily, reach)
  }

  // Nothing below depends on anything else, so the reads go out in one wave rather than
  // eight sequential round-trips.
  const [daily, [reach], weekdayRows, hourRows, plannedDays, inkRows, listRows, [calendar], [oldest]]
    = await Promise.all([
      dailyQuery,
      followThroughQuery,

      db.select({
        weekday: sql<number>`extract(isodow from ${task.completedAt} AT TIME ZONE ${tz})::int`,
        n: sql<number>`count(*)::int`,
      }).from(task)
        .where(scoped(sql`${task.completedAt} is not null and ${completedWithin(from, today, tz)}`))
        .groupBy(sql`1`),

      db.select({
        hour: sql<number>`extract(hour from ${task.completedAt} AT TIME ZONE ${tz})::int`,
        n: sql<number>`count(*)::int`,
      }).from(task)
        .where(scoped(sql`${task.completedAt} is not null and ${completedWithin(from, today, tz)}`))
        .groupBy(sql`1`),

      // Per planned day, then bucketed in JS: `date_trunc('week', …)` is always ISO/Monday and
      // the account may start its week on Sunday, and the short range wants these ungrouped
      // anyway. Bucketed below with startOfWeekStr, the same helper the grid uses.
      db.select({
        day: isoDate(plannedDay),
        total: sql<number>`count(*)::int`,
        closed: sql<number>`count(${task.completedAt})::int`,
      }).from(task)
        .where(scoped(sql`${plannedDay} between ${trendFrom}::date and ${today}::date`))
        .groupBy(sql`1`),

      db.select({
        ink: task.highlightColor,
        total: sql<number>`count(*)::int`,
        closed: sql<number>`count(${task.completedAt})::int`,
      }).from(task)
        .where(scoped(touchesWindow(from, today, tz)))
        .groupBy(task.highlightColor),

      // Lists are deliberately not windowed. The question they answer is "what is sitting in
      // Someday", which is about accumulated age, not about the last four weeks.
      db.select({
        id: list.id,
        name: list.name,
        color: list.color,
        total: sql<number>`count(${task.id})::int`,
        closed: sql<number>`count(${task.completedAt})::int`,
      }).from(list)
        .leftJoin(task, eq(task.listId, list.id))
        .where(and(eq(list.userId, userId), isNull(list.archivedAt)))
        .groupBy(list.id, list.name, list.color, list.position)
        .orderBy(asc(list.position), asc(list.id)),

      // `sourceLabel`, not `sourceEventId`: the id is ON DELETE SET NULL against a calendar
      // cache that gets pruned on re-sync, so it decays. The cached label does not.
      db.select({
        total: sql<number>`count(*)::int`,
        closed: sql<number>`count(${task.completedAt})::int`,
      }).from(task)
        .where(scoped(sql`${task.sourceLabel} is not null and ${touchesWindow(from, today, tz)}`)),

      db.select({
        title: task.title,
        createdAt: task.createdAt,
        ageDays: sql<number>`(${today}::date - (${task.createdAt} AT TIME ZONE ${tz})::date)::int`,
      }).from(task)
        .where(and(eq(task.userId, userId), isNull(task.completedAt)))
        .orderBy(asc(task.createdAt), asc(task.id))
        .limit(1),
    ])

  const base = summary(opts.range, from, today, tz, daily, reach)
  const heatmap = fillDays(yearFrom, today, daily)

  // Per-day averages share the follow-through window so the two sides are comparable.
  const windowDays = Math.max(1, heatmap.filter(d => d.date >= from && d.date <= lastFullDay).length)
  const closedInFullDays = heatmap
    .filter(d => d.date >= from && d.date <= lastFullDay)
    .reduce((sum, d) => sum + d.n, 0)

  const byWeekday = new Map(weekdayRows.map(r => [r.weekday, r.n]))
  const byHour = new Map(hourRows.map(r => [r.hour, r.n]))

  const starts = trend.unit === 'week'
    ? Array.from({ length: trend.count }, (_, i) => addDaysStr(trendFrom, i * 7))
    : eachDay(trendFrom, trend.count)
  const trendTotals = new Map(starts.map(start => [start, { total: 0, closed: 0 }]))
  for (const row of plannedDays) {
    const bucket = trendTotals.get(trend.unit === 'week' ? startOfWeekStr(row.day, weekStartsOn) : row.day)
    if (!bucket) continue
    bucket.total += row.total
    bucket.closed += row.closed
  }

  const inkTotals = new Map(inkRows.map(r => [r.ink ?? 'none', r]))
  const byInk: NamedBucket[] = [...HIGHLIGHT_INKS, 'none' as const].map(ink => ({
    key: ink,
    label: ink === 'none' ? 'Untagged' : INK_LABELS[ink],
    color: ink === 'none' ? null : ink,
    total: inkTotals.get(ink)?.total ?? 0,
    closed: inkTotals.get(ink)?.closed ?? 0,
  }))

  const medianDaysToCloseRow = await db.select({
    v: sql<number | null>`percentile_cont(0.5) within group (
      order by (${localDay(tz)} - (${task.createdAt} AT TIME ZONE ${tz})::date)::float8)`,
  }).from(task)
    .where(scoped(sql`${task.completedAt} is not null and ${completedWithin(from, today, tz)}`))

  return {
    ...base,
    heatmap,
    weekdays: rotateWeekdays(
      Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, n: byWeekday.get(i + 1) ?? 0 })),
      weekStartsOn,
    ),
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, n: byHour.get(hour) ?? 0 })),
    trend: [...trendTotals].map(([start, v]) => ({ start, ...v })),
    trendUnit: trend.unit,
    medianSlipDays: nullableNumber(reach?.medianSlipDays),
    // Floored at zero: `created_at` is stamped by the column default and `completed_at`
    // always comes later, so a negative here means imported or hand-written rows rather than
    // anything worth showing someone.
    medianDaysToClose: clampLow(nullableNumber(medianDaysToCloseRow[0]?.v), 0),
    rolled: reach?.rolled ?? 0,
    plannedPerDay: round1((reach?.planned ?? 0) / windowDays),
    closedPerDay: round1(closedInFullDays / windowDays),
    oldestOpen: oldest
      ? {
          title: oldest.title,
          createdAt: new Date(oldest.createdAt).toISOString(),
          ageDays: Math.max(0, oldest.ageDays),
        }
      : null,
    byInk,
    byList: listRows.map(l => ({
      key: l.id,
      label: l.name,
      color: l.color,
      total: l.total,
      closed: l.closed,
    })),
    fromCalendar: { total: calendar?.total ?? 0, closed: calendar?.closed ?? 0 },
  }
}

type ReachRow = {
  planned: number
  closed: number
  early: number
  onTheDay: number
  late: number
} | undefined

function summary(
  range: StatsRange,
  from: string,
  to: string,
  timezone: string,
  daily: { date: string, n: number }[],
  reach: ReachRow,
): StatsSummary {
  const year = fillDays(addDaysStr(to, -(HEATMAP_DAYS - 1)), to, daily)
  const { current, longest } = streaks(year, to)

  return {
    range,
    from,
    to,
    timezone,
    planned: reach?.planned ?? 0,
    closedOfPlanned: reach?.closed ?? 0,
    closed: year.filter(d => d.date >= from).reduce((sum, d) => sum + d.n, 0),
    early: reach?.early ?? 0,
    onTheDay: reach?.onTheDay ?? 0,
    late: reach?.late ?? 0,
    currentStreak: current,
    longestStreak: longest,
  }
}

/** `percentile_cont` comes back as a string over the wire driver, and as null on no rows. */
function nullableNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const round1 = (n: number) => Math.round(n * 10) / 10

const clampLow = (v: number | null, low: number) => (v === null ? null : Math.max(low, v))
