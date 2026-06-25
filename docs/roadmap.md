# Roadmap & Build Plan

Phased build order. Commit logically between phases. Each phase lists its deliverables and how to verify it
end-to-end. Scope is intentionally bounded — recurring tasks, reminders, two-way sync, and PWA are **later**.

## Scope

- **In scope (v1):** project setup + self-host ops, auth, week grid + task CRUD + the mutation store, drag &
  drop, calendar-sync **foundation** (read-only mirror).
- **Out of scope (later):** recurring tasks, reminders/notifications, two-way calendar sync (push), PWA/offline,
  email verification + password reset, multiple boards UI polish, sharing/collaboration.

The schema already reserves inert columns (`recurrenceRule`, `recurrenceId`, `parentId`) so the later features
don't force a painful migration. See [data-model.md](./data-model.md).

## Phase 1 — Setup + self-host ops

**Deliverables**
- Tailwind v4 (`@tailwindcss/vite`) + DaisyUI 5 paper theme (`paper` / `paper-dark`), hairline + pastel tokens;
  self-hosted Inter + Caveat.
- Pinia; Drizzle + pg wired; `drizzle.config`; committed migration workflow.
- `compose.yaml` (app + postgres + named volume) + `Dockerfile`; `.env.example` (all secrets + proxy vars);
  boot-time Zod env validation (fail fast); migrate-on-start.
- `@nuxt/eslint` + `nuxt typecheck` wired as CI gates; pnpm scripts (`dev`, `db:generate`, `db:migrate`,
  `auth:gen`, `typecheck`, `lint`, `test`).
- `LICENSE` (AGPL-3.0), README self-host section + backup/restore, source-link/version footer.

**Verify:** `docker compose up -d` starts postgres; `pnpm db:migrate` applies; `pnpm dev` renders an **empty
week grid** at :3000; `pnpm typecheck` + `pnpm lint` pass; boot fails fast with a clear message if a secret is
missing.

## Phase 2 — Auth

**Deliverables**
- Better Auth: email/password + optional Google **login** + admin plugin; `server/api/auth/[...all].ts`.
- First-user-becomes-admin via `databaseHooks.user.create.before` (count users → `role`).
- Server session guard + admin guard; SSR-hydrated `useSession`; login / register / logout / settings /
  `admin/users` pages in the paper style.
- Reverse-proxy config documented (`BETTER_AUTH_URL`, `trustedOrigins`, secure cookies).

**Verify:** first registered user row has `role='admin'`, second `'user'`; logout/login works; `/admin/users`
returns 403 for non-admins; login works behind an HTTPS reverse proxy with the documented env.

## Phase 3 — Week grid + tasks + the mutation store

**Deliverables**
- The **Pinia optimistic-mutation store first** (normalized task cache, optimistic update + rollback).
- All task CRUD, toggle-done, color tag, notes, and Someday lists routed **through the store**; prev / next /
  this-week navigation; per-user week start.
- Mobile: `DayColumn` as the reusable atom — desktop 7-col grid, phone single-day swipe + Someday sheet.
- **Opt-in rollover:** per-user toggle in settings + idempotent `POST /api/tasks/rollover` (skips recurring
  instances, guarded by `lastRolloverDate`).

**Verify:** create/edit/toggle/color/note tasks in days + Someday; week nav works; enabling rollover moves only
unfinished past non-recurring tasks once per local day (re-calling is a no-op); `rolledOverFrom` preserved.

## Phase 4 — Drag & drop

**Deliverables**
- `useTaskBoard` composable over `@atlaskit/pragmatic-drag-and-drop` (core + `/auto-scroll` + `/hitbox`):
  reorder within a list, move day↔day and day↔list.
- On drop, compute `generateKeyBetween(prev, next)` and persist via the store (PATCH `{ date|listId, position }`).
- Keyboard move model + the non-drag **"move to…" menu** fallback; cross-week moves via the nav target.
- Grid rendered client-side to avoid hydration mismatch.

**Verify:** drag within/between days/lists persists order after refresh; keyboard-only move works; move-menu
fallback works; no hydration warning; fractional-index edge cases (start/end/empty/single) behave.

## Phase 5 — Calendar sync (foundation)

**Deliverables**
- Unified connect flows: Google OAuth (dedicated, `calendar.readonly` + offline, encrypted refresh token),
  CalDAV (tsdav + app-password, encrypted), iCal URL.
- `external_calendars` enumeration + map-to-board; Nitro scheduled poll + incremental sync (syncToken/ctag,
  410 → full resync); recurrence expanded for the visible week via `ical.js`.
- Read-only events rendered in the grid; "Sync now" button.

**Verify:** connect a Google account + a CalDAV account + an iCal URL; events show read-only; a recurring event
expands correctly across next/prev week; DB inspection confirms tokens are ciphertext, not plaintext.

## Cross-cutting tests (Vitest, throughout)

- Zod input rejection on API routes.
- Fractional-index move at start / end / empty / single.
- Rollover idempotency.
- AES-GCM encrypt → decrypt round-trip.
- First-user-admin hook.

## Later phases (not scheduled)

Recurring tasks (materialize instances from `recurrenceRule`) · reminders/notifications · two-way calendar
sync · subtasks (`parentId`) · PWA/offline (`@vite-pwa/nuxt`) · email verification + password reset · i18n.
