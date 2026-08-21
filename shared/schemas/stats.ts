import { z } from 'zod'

/**
 * The API contract for the Stats page — hand-written Zod, imported by the client (types)
 * and by the endpoint (to name its shape). See docs/data-model.md for what the numbers are
 * derived from, and why `COALESCE(original_date, date)` is the day a task counts against.
 */

/** How far back the page looks. The heatmap always covers a year regardless. */
export const STATS_RANGES = ['4w', '12w', 'year'] as const
export type StatsRange = (typeof STATS_RANGES)[number]

export const STATS_RANGE_DAYS: Record<StatsRange, number> = { '4w': 28, '12w': 84, 'year': 365 }

/**
 * What the trend chart draws, per range. Derived from the range rather than fixed, so every
 * section answers the switcher — a chart that ignored it looked broken, because changing range
 * visibly changed nothing.
 *
 * The short range buckets by *day*: four weekly columns carry almost no shape and leave most of
 * the card empty, while twenty-eight daily ones fill it and say more.
 */
export const STATS_TREND: Record<StatsRange, { unit: 'day' | 'week', count: number }> = {
  '4w': { unit: 'day', count: 28 },
  '12w': { unit: 'week', count: 12 },
  'year': { unit: 'week', count: 52 },
}

/** The grid strip only needs the headline block; the page wants everything. */
export const STATS_SCOPES = ['summary', 'full'] as const
export type StatsScope = (typeof STATS_SCOPES)[number]

/** One day and how many tasks were ticked on it, in the account's timezone. */
export const dayCountSchema = z.object({
  date: z.string(),
  n: z.number().int(),
})
export type DayCount = z.infer<typeof dayCountSchema>

/** A stretch of time: how many tasks were planned into it, and how many of those closed. */
export const periodBucketSchema = z.object({
  start: z.string(),
  total: z.number().int(),
  closed: z.number().int(),
})
export type PeriodBucket = z.infer<typeof periodBucketSchema>

/** A named slice — an ink, a list. `color` is an ink *name*, so it resolves per theme. */
export const namedBucketSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string().nullable(),
  total: z.number().int(),
  closed: z.number().int(),
})
export type NamedBucket = z.infer<typeof namedBucketSchema>

export const statsSummarySchema = z.object({
  range: z.enum(STATS_RANGES),
  /** Window bounds, inclusive, as YYYY-MM-DD in the account's timezone. */
  from: z.string(),
  to: z.string(),
  timezone: z.string(),

  /**
   * Follow-through. Counts tasks whose *first* planned day falls in the window and has
   * already passed — today is excluded, because a task planned for today is not yet late.
   */
  planned: z.number().int(),
  closedOfPlanned: z.number().int(),

  /** Everything ticked inside the window, list tasks included. */
  closed: z.number().int(),

  /** Of the completed tasks that had a planned day: when they were ticked relative to it. */
  early: z.number().int(),
  onTheDay: z.number().int(),
  late: z.number().int(),

  /** Consecutive days with at least one completion. See `streaks()` for the today rule. */
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
})
export type StatsSummary = z.infer<typeof statsSummarySchema>

export const statsPayloadSchema = statsSummarySchema.extend({
  /** A year of days ending today, gaps zero-filled so the heatmap renders straight through. */
  heatmap: z.array(dayCountSchema),
  /** Seven entries, rotated so the row starts on the account's first day of the week. */
  weekdays: z.array(z.object({ weekday: z.number().int(), n: z.number().int() })),
  /** Twenty-four entries, one per hour of the local clock. */
  hours: z.array(z.object({ hour: z.number().int(), n: z.number().int() })),
  /** Planned-vs-closed per bucket over the chosen range, oldest first. */
  trend: z.array(periodBucketSchema),
  /** Whether each `trend` entry is a day or a week. */
  trendUnit: z.enum(['day', 'week']),

  /** Planning quality. Medians are null when nothing in the window qualifies. */
  medianSlipDays: z.number().nullable(),
  medianDaysToClose: z.number().nullable(),
  /** Tasks currently sitting later than the day they were first planned for. */
  rolled: z.number().int(),
  plannedPerDay: z.number(),
  closedPerDay: z.number(),
  oldestOpen: z.object({
    title: z.string(),
    createdAt: z.string(),
    ageDays: z.number().int(),
  }).nullable(),

  /** Composition. `byInk` always carries all five inks plus an untagged bucket. */
  byInk: z.array(namedBucketSchema),
  byList: z.array(namedBucketSchema),
  fromCalendar: z.object({
    total: z.number().int(),
    closed: z.number().int(),
  }),
})
export type StatsPayload = z.infer<typeof statsPayloadSchema>
