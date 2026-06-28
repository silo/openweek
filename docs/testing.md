# Testing

Automated tests run on **Vitest**. The strategy is to push real logic into small,
pure, dependency-light modules and unit-test those exhaustively, plus test the
optimistic Pinia store against a mocked transport. Heavier integration (real DB,
real Nitro routes, real drag) is covered by scripted/manual checks today; Playwright
e2e is a later phase (see [roadmap.md](./roadmap.md)).

## Running

```bash
pnpm test            # run once (CI)
pnpm test:watch      # watch mode
pnpm test:coverage   # text + html coverage report (coverage/index.html)
```

`pnpm typecheck` and `pnpm lint` are separate gates and should also pass.

## Layout & environments

Tests are co-located as `*.test.ts` next to the code. Config: [`vitest.config.ts`](../vitest.config.ts)
(via `@nuxt/test-utils`).

- **Default `node` environment** — fast pure-logic tests (schemas, ordering, env, server helpers).
- **`nuxt` environment, opt-in per file** with a top comment `// @vitest-environment nuxt` —
  for code that needs the Nuxt runtime (the Pinia store). These use `mockNuxtImport` and a
  stubbed global `$fetch`.

## What's covered

| Area | File under test | Test |
|---|---|---|
| Fractional ordering (start/end/empty/single, exclude-self, reorder) | `shared/utils/ordering.ts` | `ordering.test.ts` |
| Zod request DTOs — `date\|listId` XOR, required/format/enum rejection | `shared/schemas/task.ts`, `list.ts` | `task.test.ts`, `list.test.ts` |
| Env validation — fail-fast, 32-byte key, multi-issue message, defaults | `server/utils/runtime-config.ts` | `runtime-config.test.ts` |
| First-user-becomes-admin rule | `server/utils/first-user.ts` | `first-user.test.ts` |
| Rollover — per-timezone local day + idempotency gate | `server/utils/rollover.ts` | `rollover.test.ts` |
| Optimistic store — create/toggle/edit/delete/move/list-CRUD/rollover + **rollback** + undo | `app/stores/board.ts` | `board.nuxt.test.ts` |
| **AES-256-GCM** round-trip, tamper-fails, key-version map | `server/utils/crypto.ts` | `crypto.test.ts` |
| Task **recurrence** expansion + RRULE round-trip | `shared/utils/recurrence.ts` | `recurrence.test.ts` |
| **ical.js** parse + recurrence expansion (RRULE/EXDATE/window) | `server/utils/event-expansion.ts` | `event-expansion.test.ts` |
| Incremental-sync cursor (410 / invalid-token → resync) | `server/utils/sync-cursor.ts` | `sync-cursor.test.ts` |
| v2 DTOs — `startTime`/`recurrence`/`parentId`, `list.color`, sync connect/convert | `shared/schemas/*` | `task/list/sync.test.ts` |

These map onto the roadmap's cross-cutting test list (Zod rejection, fractional-index edge cases,
rollover idempotency, first-user-admin, and the **AES-GCM round-trip** — now landed in Phase 6).

## Design-for-testability

Pure helpers were extracted so the load-bearing logic is testable without a DB, Nitro, or a
browser:

- `shared/utils/ordering.ts` — all fractional-index math (used by the store, the DnD monitor,
  and the move-menu — one source of truth).
- `server/utils/first-user.ts`, `server/utils/rollover.ts` — the admin + rollover decisions,
  separate from the Better Auth hook and the DB `UPDATE`.
- `server/utils/runtime-config.ts` exposes a pure `validateEnv(source)` alongside the cached
  `getEnv()`.

## Not yet automated (verified another way)

- **DB-level guarantees** (the `date|listId` CHECK, composite FK, cascade deletes, rollover's
  advisory-locked `UPDATE`) — exercised against a real Postgres during development.
- **Drag & drop and full-page render** — verified with a scripted Playwright (`playwright-core`)
  run driving system Chrome. A committed Playwright e2e suite is a later phase.
