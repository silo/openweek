/**
 * Local demo data.
 *
 * Creates (or reuses) a demo account and replaces its data with a week that exercises
 * every feature of the Paper/Ink design: the five inks, both highlight modes, per-task
 * times and notes, the done-fold, the rollover banner, four lists, and calendar events
 * across three connection types.
 *
 * Run with `pnpm db:seed`. Safe to re-run — it wipes only the demo user's rows.
 *
 * Task placement is deliberate: days *before* today get completed tasks only. Rollover is
 * enabled so the review banner has something to show, and rollover moves unfinished tasks
 * off past days — seeding open tasks there would scramble the week on first load.
 */
import { eq } from 'drizzle-orm'
import { db, pool } from '../server/database/client'
import {
  calendarConnection,
  calendarEvent,
  calendarSource,
  list,
  task,
  user,
  userSettings,
} from '../server/database/schema'
import { auth } from '../server/utils/auth'
import { encryptJson } from '../server/utils/crypto'
import { keyBetween } from '../server/services/ordering'
import { parseConfig } from '../server/utils/config'
import { DEFAULT_ACCENT, HIGHLIGHT_INKS } from '../shared/constants/colors'
import type { HighlightInk } from '../shared/constants/colors'

const EMAIL = 'demo@openweek.test'
const PASSWORD = 'demo1234'
const NAME = 'Astrid'

// --- helpers ---------------------------------------------------------------

/** n successive fractional-index keys. */
function positions(n: number): string[] {
  const out: string[] = []
  let prev: string | null = null
  for (let i = 0; i < n; i++) {
    prev = keyBetween(prev, null)
    out.push(prev)
  }
  return out
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Monday of the week containing `d`. */
function monday(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7))
}

function at(date: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(`${date}T00:00:00`)
  d.setHours(h!, m!, 0, 0)
  return d
}

/**
 * A fixed-seed PRNG. The history below needs to look scattered, but `Math.random` would give
 * every re-seed a different heatmap — and then "does this number look right?" has no answer.
 */
function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x1_0000_0000
  }
}

// --- shapes ----------------------------------------------------------------

interface SeedTask {
  title: string
  ink?: HighlightInk
  time?: string
  note?: string
  done?: boolean
  /** Set to render the "carried over" mark and put it in the rollover banner. */
  rolledFrom?: string
}

// --- run -------------------------------------------------------------------

async function main() {
  parseConfig() // fail fast with the same message the app gives

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = iso(today)
  const weekStart = monday(today)
  const week = Array.from({ length: 7 }, (_, i) => iso(addDays(weekStart, i)))
  const lastFriday = iso(addDays(weekStart, -3))

  // 1. account -------------------------------------------------------------
  let [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, EMAIL))
  if (!row) {
    // Better Auth handles password hashing and the databaseHooks that create the
    // settings row and assign the admin role.
    await auth.api.signUpEmail({ body: { name: NAME, email: EMAIL, password: PASSWORD } })
    ;[row] = await db.select({ id: user.id }).from(user).where(eq(user.email, EMAIL))
  }
  const userId = row!.id

  // 2. wipe this user's data (sources/events cascade from the connection) ----
  await db.delete(task).where(eq(task.userId, userId))
  await db.delete(list).where(eq(list.userId, userId))
  await db.delete(calendarConnection).where(eq(calendarConnection.userId, userId))

  // 3. settings -------------------------------------------------------------
  await db.update(userSettings).set({
    theme: 'system',
    accentColor: DEFAULT_ACCENT,
    fontStyle: 'open-sans',
    tagStyle: 'edge',
    textSize: 'default',
    showWeekends: true,
    collapseDone: true,
    rolloverEnabled: true,
    showCalendarEvents: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  }).where(eq(userSettings.userId, userId))

  // 4. lists ----------------------------------------------------------------
  const listSpecs: { name: string, color: HighlightInk, isDefault?: boolean, tasks: SeedTask[] }[] = [
    {
      name: 'Someday',
      color: 'indigo',
      isDefault: true,
      tasks: [
        { title: 'Learn to mend knitwear' },
        { title: 'Reread The Summer Book' },
        { title: 'A cabin week in the archipelago', note: 'Check the ferry timetable first.' },
      ],
    },
    {
      name: 'Work',
      color: 'magenta',
      tasks: [
        { title: 'Expense report for August' },
        { title: 'Ask Priya about the offsite', ink: 'indigo' },
        { title: 'Archive the Q2 boards', done: true },
      ],
    },
    { name: 'Personal', color: 'jade', tasks: [{ title: 'Renew passport' }, { title: 'Frame the Lofoten print' }] },
    {
      name: 'Groceries',
      color: 'amber',
      tasks: [
        { title: 'Oat milk' },
        { title: 'Rye flour' },
        { title: 'Dill' },
        { title: 'Coffee beans', done: true },
      ],
    },
  ]

  const listPos = positions(listSpecs.length)
  for (const [i, spec] of listSpecs.entries()) {
    const [created] = await db.insert(list).values({
      userId, name: spec.name, color: spec.color, isDefault: !!spec.isDefault, position: listPos[i]!,
    }).returning()
    const pos = positions(spec.tasks.length)
    if (spec.tasks.length) {
      await db.insert(task).values(spec.tasks.map((t, j) => ({
        userId,
        listId: created!.id,
        position: pos[j]!,
        title: t.title,
        note: t.note ?? null,
        highlightColor: t.ink ?? null,
        completedAt: t.done ? new Date() : null,
        // Backdated, and Someday furthest of all: a list is where things go to age, and the
        // "oldest open task" line has nothing to report if every row was written this morning.
        createdAt: at(iso(addDays(today, -(spec.isDefault ? 150 + j * 40 : 20 + i * 15 + j * 6))), '09:00'),
      })))
    }
  }

  // 5. the week -------------------------------------------------------------
  // Past days carry finished work only (see the note at the top of this file).
  const past: SeedTask[] = [
    { title: 'Renew library card', done: true },
    { title: 'Bins out', done: true },
    { title: 'Sweep the balcony', done: true },
  ]
  const onToday: SeedTask[] = [
    { title: 'Water the balcony plants', ink: 'amber', rolledFrom: lastFriday },
    { title: 'Call Mum', time: '19:00', note: 'Ask about the ferry tickets.' },
    { title: 'Ship the week-notes post', ink: 'indigo', note: 'Include the garden photos.' },
    { title: 'Clear the gutters', done: true },
    { title: 'Book dentist', done: true },
  ]
  const future: SeedTask[][] = [
    [{ title: 'Draft the garden plan', ink: 'jade', note: 'Raised beds along the south wall.' }, { title: 'Post birthday card to Jonas' }],
    [{ title: 'Long run', time: '06:30', ink: 'persimmon' }, { title: 'Prep notes for the 1:1' }],
    [{ title: 'Bake rye for the weekend', ink: 'magenta' }, { title: 'Pick up the race packet', time: '17:30' }],
    [{ title: 'Farmers’ market', time: '09:00' }, { title: 'Fix the front brake' }],
    [{ title: 'Plan next week', time: '20:00' }, { title: 'Iron shirts' }],
    [{ title: 'Water the herbs' }],
  ]

  let futureIdx = 0
  const dayRows = week.flatMap((date, dayIndex) => {
    let items: SeedTask[]
    if (date < todayStr) items = past.slice(0, 2 + (dayIndex % 2))
    else if (date === todayStr) items = onToday
    else items = future[futureIdx++ % future.length]!

    const pos = positions(items.length)
    return items.map((t, j) => ({
      userId,
      date,
      position: pos[j]!,
      title: t.title,
      note: t.note ?? null,
      highlightColor: t.ink ?? null,
      timeOfDay: t.time ?? null,
      originalDate: t.rolledFrom ?? null,
      completedAt: t.done ? new Date() : null,
    }))
  })
  await db.insert(task).values(dayRows)

  // 5b. history -------------------------------------------------------------
  // Ten months of finished weeks behind the curated one, so the Stats page has a heatmap,
  // streaks, a weekday shape and a week-over-week trend to draw. Without this the whole page
  // renders one column and reads as broken.
  const rand = lcg(20260821)
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!

  const HISTORY_DAYS = 300
  const HISTORY_TITLES = [
    'Morning pages', 'Reply to the week’s email', 'Run the numbers for the studio',
    'Walk the dog', 'Stretch', 'Read a chapter', 'Tidy the desk', 'Water the herbs',
    'Invoice the studio', 'Weekly backup', 'Call the landlord', 'Sort the recycling',
    'Practise scales', 'Plan the shopping', 'Check the bike tyres', 'Write the standup note',
    'Book the rehearsal room', 'Review the pull request', 'Update the budget sheet',
    'Change the bed linen', 'Cook something new', 'Ring Grandad', 'Sweep the stairs',
  ]
  // Weighted so the time-of-day chart has a morning and an evening lobe rather than a flat bar.
  const HOURS = [7, 8, 8, 9, 9, 9, 10, 10, 11, 12, 13, 14, 15, 16, 16, 17, 17, 18, 19, 20, 21]

  const now = new Date()
  // Same shape as the curated week's rows, plus the cached calendar label.
  const historyRows: ((typeof dayRows)[number] & { sourceLabel: string | null, createdAt: Date })[] = []

  for (let back = HISTORY_DAYS; back > 0; back--) {
    const day = addDays(today, -back)
    const dayStr = iso(day)
    if (dayStr >= week[0]!) continue // the curated week owns its own days

    const weekend = day.getDay() === 0 || day.getDay() === 6
    const roll = rand()
    // Quiet weekends and the occasional empty weekday are what give the heatmap texture and
    // the streaks somewhere to break.
    const count = weekend
      ? (roll < 0.55 ? 0 : 1 + Math.floor(rand() * 2))
      : (roll < 0.08 ? 0 : 1 + Math.floor(rand() * 5))

    const pos = positions(count)
    for (let i = 0; i < count; i++) {
      const outcome = rand()
      const slip = outcome < 0.12 ? -1 : outcome < 0.8 ? 0 : 1 + Math.floor(rand() * 4)
      const closedOn = addDays(day, slip)
      if (closedOn > today) continue

      const completedAt = new Date(closedOn)
      completedAt.setHours(pick(HOURS), Math.floor(rand() * 60), 0, 0)
      if (completedAt > now) completedAt.setTime(now.getTime() - Math.floor(rand() * 3_600_000))

      historyRows.push({
        userId,
        // A task that slipped is where rollover left it: moved to the day it was finally
        // finished, with the day it was first planned for kept in originalDate.
        date: slip > 0 ? iso(closedOn) : dayStr,
        position: pos[i]!,
        title: pick(HISTORY_TITLES),
        note: null,
        highlightColor: rand() < 0.32 ? pick(HIGHLIGHT_INKS) : null,
        timeOfDay: null,
        originalDate: slip > 0 ? dayStr : null,
        completedAt,
        sourceLabel: rand() < 0.05 ? 'Work · Studio' : null,
        // Written a day or two before the day it was planned for. Left at the column default
        // every row would look created today, and "time to close" would come out negative.
        createdAt: at(iso(addDays(day, -Math.floor(rand() * 3))), '09:00'),
      })
    }
  }

  // What a rollover account actually accumulates: a handful of tasks that keep moving forward
  // and never get finished. They sit on today with originalDate pointing back, which is where
  // rollover would have left them — and they are what keeps follow-through from reading 100%,
  // because every one of them is a day that was planned and not delivered.
  const LINGERING = [
    'Sort out the loft', 'Cancel the old gym membership', 'Back up the photo library',
    'Reply to Anders about the boat', 'Descale the kettle', 'Find a dentist that takes new patients',
  ]
  // Continues past the keys the curated day used, so these sit below it rather than tying.
  const lingerPos = positions(20).slice(10)
  historyRows.push(...LINGERING.map((title, i) => ({
    userId,
    date: todayStr,
    position: lingerPos[i]!,
    title,
    note: null,
    highlightColor: null,
    timeOfDay: null,
    originalDate: iso(addDays(today, -(4 + i * 3))),
    completedAt: null,
    sourceLabel: null,
    createdAt: at(iso(addDays(today, -(6 + i * 3))), '09:00'),
  })))

  await db.insert(task).values(historyRows)

  // 6. calendars ------------------------------------------------------------
  // Read-only demo feeds. The credentials are fake but really encrypted, so the rows
  // are shaped exactly like live ones.
  const connections: { provider: 'google' | 'caldav' | 'ical', displayName: string, color: HighlightInk, sources: { name: string, color: HighlightInk, enabled?: boolean }[] }[] = [
    {
      provider: 'google',
      displayName: 'astrid@example.org',
      color: 'indigo',
      sources: [{ name: 'Personal', color: 'indigo' }, { name: 'Work · Studio', color: 'magenta' }],
    },
    { provider: 'caldav', displayName: 'caldav.example.net', color: 'jade', sources: [{ name: 'Family', color: 'jade' }] },
    { provider: 'ical', displayName: 'holidays.ics', color: 'amber', sources: [{ name: 'DK holidays', color: 'amber', enabled: false }] },
  ]

  const sourceIds: Record<string, string> = {}
  for (const c of connections) {
    const enc = encryptJson({ demo: true })
    const [conn] = await db.insert(calendarConnection).values({
      userId,
      provider: c.provider,
      displayName: c.displayName,
      color: c.color,
      encryptedCredentials: enc.ciphertext,
      iv: enc.iv,
      authTag: enc.authTag,
      encKeyVersion: enc.keyVersion,
      lastSyncedAt: new Date(Date.now() - 4 * 60 * 1000),
    }).returning()
    for (const s of c.sources) {
      const [src] = await db.insert(calendarSource).values({
        connectionId: conn!.id,
        remoteId: `demo-${s.name.toLowerCase().replace(/\W+/g, '-')}`,
        name: s.name,
        color: s.color,
        enabled: s.enabled ?? true,
        lastSyncedAt: new Date(Date.now() - 4 * 60 * 1000),
      }).returning()
      sourceIds[s.name] = src!.id
    }
  }

  const events: { source: string, day: number, time: string | null, title: string }[] = [
    { source: 'Work · Studio', day: 1, time: '13:00', title: 'Studio review' },
    { source: 'Work · Studio', day: 2, time: '10:00', title: 'Team sync' },
    { source: 'Personal', day: 0, time: '14:00', title: 'Dentist' },
    { source: 'Personal', day: 3, time: '19:30', title: 'Book club' },
    { source: 'Family', day: 4, time: null, title: 'Ferry to Rømø' },
    { source: 'DK holidays', day: 5, time: null, title: 'Constitution Day' },
  ]

  await db.insert(calendarEvent).values(events.map((e, i) => {
    const date = week[e.day]!
    const start = e.time ? at(date, e.time) : new Date(`${date}T00:00:00`)
    const end = e.time ? new Date(start.getTime() + 60 * 60 * 1000) : new Date(`${date}T23:59:59`)
    return {
      userId,
      sourceId: sourceIds[e.source]!,
      remoteUid: `demo-event-${i}`,
      title: e.title,
      startAt: start,
      endAt: end,
      allDay: !e.time,
      localDate: date,
      timeLabel: e.time,
    }
  }))

  // --- summary -------------------------------------------------------------
  const taskCount = await db.$count(task, eq(task.userId, userId))
  console.log(`\n  Seeded ${EMAIL}`)
  console.log(`  password: ${PASSWORD}`)
  console.log(`  week of ${week[0]} — ${taskCount} tasks, ${listSpecs.length} lists, ${events.length} events across 3 calendars`)
  console.log(`  plus ${historyRows.length} rows of history behind it, so Stats has something to draw`)
  console.log('\n  pnpm dev  →  http://localhost:3000\n')
}

main()
  .catch((err) => {
    console.error('\nSeed failed:\n', err instanceof Error ? err.message : err, '\n')
    process.exitCode = 1
  })
  .finally(() => pool.end())
