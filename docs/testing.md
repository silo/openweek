# Testing

Test stack: **Vitest** + `@nuxt/test-utils` + `@vue/test-utils` + **happy-dom**. Playwright is added later for
end-to-end drag-and-drop. The goal is a fast unit/component suite that runs on every change, plus an
integration layer against a real Postgres, all gated in CI.

## Layers

### Unit (pure logic — the highest-value tests)
- **Ordering** — `generateKeyBetween` between two keys, at both edges, and jitter behavior; the `(position, id)`
  sort stays stable under concurrent same-slot inserts.
- **Week/date math** — `useWeek` boundaries across timezones and **DST transitions** (`date-fns-tz`); Monday vs
  Sunday week starts.
- **Rollover** — overdue-open tasks move to today, `originalDate` is preserved, and re-running is idempotent.
- **Recurrence expansion** — `ical.js` against ICS fixtures exercising **EXDATE**, **RECURRENCE-ID** overrides,
  **RDATE**, and **VTIMEZONE**.
- **Crypto** — AES-256-GCM round-trip; decrypt with the wrong key fails; `encKeyVersion` selects the key.
- **Contract smoke** — import a `drizzle-zod`-generated schema and `parse()` a sample row (guards a future
  zod4 / drizzle-zod version split — see [tech-stack.md](./tech-stack.md)).
- **Colour constants** — the ink palette, its per-theme values, and `inkColor()`'s pass-through for
  pre-rework hex values (`shared/constants/colors.test.ts`).
- **Stats arithmetic** — zero-filling a sparse day series, both streaks (including the rule that an
  as-yet-empty *today* does not break the current one), weekday rotation under either week start, and the
  heatmap intensity steps (`shared/utils/stats.test.ts`). The aggregation itself is SQL and the timezone
  bucketing is `AT TIME ZONE`, so neither is unit-testable without a live database — verify those against
  `pnpm db:psql` (see below).

### Component (happy-dom)
`TaskItem` across states (open/done/`edge` vs `fill` highlight/rolled/meta/note), `EventItem`,
`TaskDetailPopover`, `DayColumn` inline composer and done-fold, `ListCard` menu, `AppearanceSettings`.
Assert rendered structure + a11y roles, not pixel styles.

### Checking Stats against the database

The aggregates have no unit-test seam, so check them by hand after touching `server/services/stats.ts`:

- Cross-check a figure: run the follow-through query from `pnpm db:psql` and compare it to `/api/stats`.
- **The timezone case, which is the one that actually bites.** Insert a completion at `22:30Z` on some day,
  then read `/api/stats` with the account's `timezone` set to `UTC`, `Europe/Copenhagen` and
  `Pacific/Auckland` in turn: it must land on that day under UTC and on the *next* day under both of the
  others. If it lands on the same day in all three, something is grouping on raw `completed_at`.

## Local demo data

`pnpm db:seed` creates (or reuses) **demo@openweek.test** / **demo1234** and replaces its data with a
week built to exercise the whole design: all five inks, per-task times and notes, a done-fold on a day
*and* a list, the rollover banner, four lists, and events across a Google / CalDAV / iCal connection with
one calendar switched off so the `3/4` count is visible.

It is idempotent — re-running replaces that user's rows and leaves every other account alone.

Task placement is deliberate: days before today carry **completed tasks only**. Rollover is enabled so
the review banner has something to show, and rollover moves unfinished tasks off past days, so open
tasks seeded there would be scrambled on first load.

### Server / integration (test Postgres)
Endpoints exercised against a disposable Postgres (a compose db or Testcontainers): task CRUD, **move/ordering
persistence**, list CRUD, convert-event, settings read/write, the **auth guard** (401 when unauthenticated,
owner-scoping across users), and the **first-user-becomes-admin** hook.

### End-to-end (Playwright — `e2e/basic.spec.ts`, run against `pnpm db:seed` data)
In place: sign-in lands on the week grid; adding a task to a day; focusing a day widens its column; **ticking a
task** draws the strike-through *before* the row folds away; the **lists rail** resizes from its grip and hides
when dragged to the floor.

Two things to know when writing more: the mobile day view is in the DOM alongside the grid (just hidden), so an
unscoped locator matches today's rows twice — scope to `[style*="grid-template-columns"]`. And a created row is
optimistic, so wait for the `POST /api/tasks` response before acting on it.

Still to cover: DnD reorder within a day and **move across days** with **both mouse and keyboard**; connect a
public iCal feed and see events land; convert an event to a task.

## Fixtures & helpers
- ICS fixtures under `test/fixtures/ics/` (recurring weekday event, all-day, cancelled instance, tz-spanning).
- A `withTestDb()` helper that migrates a fresh schema and truncates between tests.
- A `seedUser()` / `authedFetch()` helper for session-scoped endpoint tests.

## Commands & CI gate

```bash
pnpm test           # Vitest (watch off in CI)
pnpm test:coverage  # coverage report
pnpm typecheck      # vue-tsc — build does NOT type-check by default, so this is a real gate
pnpm lint           # @nuxt/eslint
```

**CI runs `pnpm lint && pnpm typecheck && pnpm test` and blocks merge on any failure.** `typecheck` is
mandatory because Nuxt's default build skips type-checking. Keep the contract smoke test in the default run so
dependency bumps that break the Zod/Drizzle coupling fail loudly.

## Conventions
- Co-locate unit tests next to source (`*.test.ts`); component tests as `*.spec.ts`.
- Prefer testing behavior through the public API of a composable/store over internals.
- Every bug fix lands with a regression test.

## Related docs
[architecture.md](./architecture.md) · [data-model.md](./data-model.md) · [calendar-sync.md](./calendar-sync.md)
