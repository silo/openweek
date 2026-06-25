# Openweek — Project Context (CLAUDE.md)

> Authoritative context for future sessions. Stack, conventions, data model, and "how to run".
> Detailed design lives in [`/docs`](./docs/README.md). This file is the quick reference; `/docs` is the depth.

## What we're building

**Openweek** — a free, **open-source**, self-hostable **minimalist weekly planner / to-do app**, in the
spirit of tweek.so, teuxdeux.com, and weektodo.me. The core UX is a **paper-planner week grid**: seven day
columns plus "Someday" lists, where tasks are bullet items you drag around, check off, and color-tag. **No
hourly scheduling** — the week grid *is* the interface.

License: **AGPL-3.0** (so hosted forks stay open). Self-hosting via Docker is a first-class use case.

## Status

Greenfield. The repo is currently a bare **Nuxt 4.4.8** starter (`app/app.vue` only — no `server/`, no
schema, no app deps yet). Planning is complete and documented; implementation has **not** started. Build
order is in [docs/roadmap.md](./docs/roadmap.md).

## Tech stack (final — see [docs/tech-stack.md](./docs/tech-stack.md) for versions + rationale)

- **Nuxt 4** (app/ srcDir + shared/ + Nitro server/), TypeScript **strict**, SSR on, **pnpm**.
- **PostgreSQL** + **Drizzle ORM** + **drizzle-kit** (committed SQL migrations).
- **Zod 4** validation; **drizzle-zod** to derive schemas from app tables.
- **Tailwind CSS v4** via **`@tailwindcss/vite`** (CSS-first) + **DaisyUI 5** — custom "paper" theme.
  DaisyUI is used for **theme tokens, dark mode, and overlay/form primitives only**; the week grid is custom.
- **Better Auth** for login (email/password + optional Google OAuth + **admin plugin**, first-user-becomes-admin).
- **Pinia** with a single optimistic-mutation store for the week grid.
- **`@atlaskit/pragmatic-drag-and-drop`** for accessible drag & drop (wrapped in our own Vue composable).
- **`fractional-indexing-jittered`** + **uuid v7** ids for ordering.
- **`date-fns`** / `date-fns-tz` for dates (week starts per-user, default Monday).
- **Calendar sync:** `@googleapis/calendar` + `google-auth-library` (Google), `tsdav` (CalDAV), iCal URL
  fetch; `ical.js` for recurrence expansion. Read-only mirror first; architected for later two-way sync.
- **Lint/format:** `@nuxt/eslint`. **Tests:** Vitest (+ Playwright later for e2e DnD).
- **Docker Compose** (app + postgres) for dev + self-hosting.

> Deliberately **rejected**: `vuedraggable@next` (abandoned), `@nuxtjs/tailwindcss` (Tailwind-v3-era),
> `googleapis` umbrella (207 MB), `rrule` (unmaintained), Google push/watch (needs public HTTPS). See
> [docs/tech-stack.md](./docs/tech-stack.md#rejected-and-why).

## Project structure

See [docs/architecture.md](./docs/architecture.md). Summary:
- `app/` — Vue: `components/week/` (custom grid), `components/ui/` (DaisyUI wrappers), `composables/`,
  `pages/`, `stores/board.ts`.
- `shared/schemas/` — Zod request/response DTOs imported via `#shared` (NO drizzle runtime, no Vue/Nitro).
- `server/` — `db/schema/` (Drizzle tables, server-only), `api/`, `utils/` (auth, crypto, env validation),
  `tasks/sync.ts` (Nitro scheduled poll).
- `drizzle/` — committed migrations. Root: `Dockerfile`, `compose.yaml`, `.env.example`, `LICENSE`.

## Data model (see [docs/data-model.md](./docs/data-model.md))

Better Auth owns `user`/`session`/`account`/`verification` (admin plugin adds `role`). User
`additionalFields`: `timezone`, `weekStartsOn`, `rolloverEnabled`. App tables (uuid v7 ids):
- **`boards`** — the user's planner container (renamed from "calendars" to avoid colliding with external
  calendars). New users get one default board.
- **`lists`** — "Someday"/custom columns within a board (day columns are derived from dates, not stored).
- **`tasks`** — belong to a board, and to **either** a `date` **or** a `listId` (enforced by a DB CHECK).
  `position` is a fractional index. Carries inert nullable `recurrenceRule`/`recurrenceId`/`parentId` for
  forward-compat.
- **`connected_accounts`** + **`external_calendars`** + **`synced_events`** — the calendar-sync layer
  (Google/CalDAV/iCal), tokens encrypted at rest. See [docs/calendar-sync.md](./docs/calendar-sync.md).

## Conventions

- **API:** Nitro routes under `server/api/**`, every input validated with **shared Zod** DTOs; session-checked
  via Better Auth; admin routes guarded by `role === 'admin'`. Typed `$fetch`/`useFetch` (no tRPC).
- **Shared schemas:** Drizzle **table defs are server-only** (`server/db/schema/`). Only plain Zod DTOs live in
  `shared/schemas/` so nothing DB-related leaks into the client bundle.
- **State/mutations:** all task writes (CRUD, toggle, color, drag-persist, rollover) funnel through the Pinia
  store with optimistic update + rollback. This keeps a later PWA/offline mode additive.
- **Ordering:** never `ORDER BY position` alone — always `(position, id)` (uuid v7 tiebreaker).
- **Rollover:** explicit authenticated POST (never an SSR side-effect), idempotent per-user-per-local-day,
  skips recurring instances. **Opt-in** (off by default), per-user toggle.
- **Secrets/encryption:** AES-256-GCM (`node:crypto`) for CalDAV/Google tokens, per-record IV + auth tag +
  `encKeyVersion`. Env is **Zod-validated at boot** (fail fast).

## How to run (planned scripts — wired in Phase 1)

```bash
pnpm install
docker compose up -d db        # postgres
pnpm db:generate && pnpm db:migrate
pnpm dev                       # http://localhost:3000
pnpm typecheck && pnpm lint
docker compose up              # full self-host stack
```
Required env (see `.env.example` once created): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`OPENWEEK_ENCRYPTION_KEY` (base64, 32 bytes), optional `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`. Full list:
[docs/self-hosting.md](./docs/self-hosting.md).

## Locked decisions / one-way doors

Recorded in [docs/decisions.md](./docs/decisions.md). Highlights: `boards` naming · unified
`connected_accounts` (multiple Google accounts + CalDAV + iCal) · uuid v7 + jittered fractional ordering ·
inert recurrence/parent columns · `date|listId` XOR CHECK · AGPL LICENSE in first commit · `encKeyVersion`
for key rotation · Zod 4 pin · accessible Pragmatic DnD with a non-drag move-menu fallback.

## Scope

**Now:** setup/self-host ops → auth → week grid + task CRUD + the mutation store → drag & drop → calendar-sync
foundation (read-only). **Later (not yet):** recurring tasks, reminders, two-way calendar sync, PWA/offline.

## How to work in this repo

1. Implement in the phase order above; commit logically between phases.
2. Keep this file and `/docs` in sync when stack/conventions/data-model change.
3. Flag one-way doors (schema shape, auth model, ordering, naming) before committing to them — most are
   already decided in [docs/decisions.md](./docs/decisions.md).
