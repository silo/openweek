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

### Component (happy-dom)
`TaskItem` across states (open/done/`edge` vs `fill` highlight/rolled/meta/note), `EventItem`,
`TaskDetailPopover`, `DayColumn` inline composer and done-fold, `ListCard` menu, `AppearanceSettings`.
Assert rendered structure + a11y roles, not pixel styles.

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

### End-to-end (Playwright — later phase)
DnD reorder within a day and **move across days** with **both mouse and keyboard**; complete a task; connect a
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
