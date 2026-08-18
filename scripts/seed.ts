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
import { DEFAULT_ACCENT } from '../shared/constants/colors'
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
  for (const date of week) {
    let items: SeedTask[]
    if (date < todayStr) items = past.slice(0, 2 + (week.indexOf(date) % 2))
    else if (date === todayStr) items = onToday
    else items = future[futureIdx++ % future.length]!

    const pos = positions(items.length)
    await db.insert(task).values(items.map((t, j) => ({
      userId,
      date,
      position: pos[j]!,
      title: t.title,
      note: t.note ?? null,
      highlightColor: t.ink ?? null,
      timeOfDay: t.time ?? null,
      originalDate: t.rolledFrom ?? null,
      completedAt: t.done ? new Date() : null,
    })))
  }

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
  console.log('\n  pnpm dev  →  http://localhost:3000\n')
}

main()
  .catch((err) => {
    console.error('\nSeed failed:\n', err instanceof Error ? err.message : err, '\n')
    process.exitCode = 1
  })
  .finally(() => pool.end())
