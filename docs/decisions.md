# Decision Log

Lightweight ADR-style record of the choices that are **hard to reverse** or that override the original
`CLAUDE.md` init prompt. Each entry: the decision, the context/why, and its status. Add new entries rather than
rewriting history.

Legend: 🔒 one-way door (hard to change once code lands) · ✅ confirmed with the user.

---

### D1 — Framework is Nuxt 4, not Nuxt 3 ✅
The repo was already scaffolded as Nuxt 4.4.8 (the init prompt said "Nuxt 3"). We adopt Nuxt 4 conventions:
`app/` srcDir, `shared/` for cross-cutting code, Nitro `server/`. Doc wording updated.

### D2 — Planner container named `boards`, not `calendars` 🔒 ✅
**Why:** the app also mirrors external Google/CalDAV/iCal *calendars*; two "calendar" concepts in one codebase
guarantees confusion in code, routes, and UI copy, and renaming after migrations/URLs harden is expensive.
**Decision:** the user's planner container is `boards`; "calendar" is reserved for external sources. Cascades to
`tasks.boardId`, `lists.boardId`, `/api/boards`. _User chose "boards" over planners/spaces._

### D3 — Drag & drop: `@atlaskit/pragmatic-drag-and-drop` ✅
**Why:** the planned `vuedraggable@next` is abandoned (last release 2021). Accessible keyboard/screen-reader
drag is a **v1 requirement**, and Pragmatic is the only maintained option with a real a11y model. It has no
official Vue adapter, so we write a thin `useTaskBoard` composable and keep the engine swappable in one file.
Always paired with a non-drag "move to…" menu fallback. _User selected the a11y-first option._

### D4 — Unified `connected_accounts` for calendar sync 🔒 ✅
**Why:** the user wants to connect **multiple Google accounts + CalDAV + iCal** sources, independent of login.
**Decision:** one store + one sync loop + one encryption path for all three providers, separate from Better
Auth's login identity. Forks the schema/refresh/encryption — decided before the auth phase. See
[calendar-sync.md](./calendar-sync.md). _User: "it should be possible to add more like ical, caldav and
different google calendar accounts."_

### D5 — Auto-rollover is opt-in ✅
**Why:** teuxdeux auto-rolls; tweek makes it opt-in. **Decision:** default **off** (`user.rolloverEnabled`),
per-user toggle ships regardless. Implemented as an explicit idempotent POST (never an SSR side-effect),
mutating `date` but preserving `rolledOverFrom`, skipping recurring instances. _User chose opt-in._

### D6 — IDs are uuid v7; ordering is jittered fractional, sorted `(position, id)` 🔒
**Why:** the app is headed toward cross-device/two-way sync; plain `fractional-indexing` produces identical
colliding keys on concurrent same-slot inserts. **Decision:** `fractional-indexing-jittered` + a time-sortable
uuid v7 tiebreaker; never `ORDER BY position` alone. Baked into the id type and every ordering query from
migration 1.

### D7 — Inert recurrence/subtask columns added now 🔒
**Why:** adding `recurrenceRule` / `recurrenceId` / `parentId` later means a migration over populated, ordered,
rollover-mutated task data. **Decision:** add them as **inert nullable** columns in the first migration; build
behaviour later. One RFC-5545 RRULE representation is shared by `tasks` and `synced_events` for clean future
two-way sync.

### D8 — `date | listId` XOR enforced as a DB CHECK 🔒
**Why:** prose invariants drift. **Decision:** `CHECK ((date IS NOT NULL) <> (list_id IS NOT NULL))` plus a
composite FK `(list_id, board_id) → lists(id, board_id)` in the first migration, so no code path can violate
"exactly one of date|list" or cross-board list assignment.

### D9 — Tailwind v4 via `@tailwindcss/vite` + DaisyUI 5; DaisyUI for plumbing only ✅
**Why:** `@nuxtjs/tailwindcss` is Tailwind-v3-era; v4 is CSS-first. DaisyUI's component opinions fight the
paper aesthetic. **Decision:** Vite plugin + CSS-first themes; DaisyUI used only for tokens, dark mode, and
overlay/form primitives; grid/day-column/bullet-row are custom. See [design.md](./design.md).

### D10 — Auth is Better Auth; login separate from calendar connection ✅
**Why:** Lucia is deprecated; Better Auth is the maintained, Drizzle-friendly choice with email/password +
Google + admin plugin. **Decision:** Better Auth owns login only; Google *calendar* connection is a separate
OAuth flow into `connected_accounts` (see D4). First user becomes admin via a before-create count hook.

### D11 — Lean calendar libraries 🔒-ish
**Why:** `googleapis` is 207 MB; `rrule` is unmaintained and RRULE-string-only; Google push needs public
HTTPS. **Decision:** `@googleapis/calendar` + `google-auth-library`, `tsdav`, `ical.js` for expansion, and
**polling** via a Nitro scheduled task. See [tech-stack.md](./tech-stack.md#rejected-and-why).

### D12 — Token encryption: AES-256-GCM with key versioning 🔒
**Why:** self-hosters provide an env key; rotation must be possible. **Decision:** `node:crypto` AES-256-GCM,
per-record 12-byte IV + auth tag, `encKeyVersion` column + a `{version: key}` map for lazy re-encryption. Key
is 32 bytes (base64 env), validated at boot. Retrofitting versioning onto encrypted rows is painful — so it's
in from day one.

### D13 — Data layer: typed Nitro + shared Zod (no tRPC); single optimistic Pinia store ✅
**Why:** Nuxt already infers response types end-to-end; tRPC would duplicate routing and fight Better Auth's
route mounting. A unified mutation funnel makes a later PWA additive. **Decision:** plain Nitro routes + typed
`$fetch` + `#shared` Zod DTOs; all writes flow through one Pinia store with optimistic update + rollback.

### D14 — OSS hygiene from commit 1 ✅
**Why:** AGPL is a stated hard requirement and the point of the project. **Decision:** `LICENSE` (AGPL-3.0) +
source-link/version footer (network-use clause) in the first commit; consolidated `.env.example`; fail-fast env
validation; Postgres backup/restore docs; `nuxt typecheck` + ESLint CI gate; pin **Zod 4** + drizzle-zod
together. _Confirm CLA/DCO policy before accepting external PRs (open item)._

### D15 — v2 "paper" redesign keeps the tag-color union; accent is a runtime CSS var ✅
**Why:** the v2 design renames tag colors (butter/mint/sky/rose) but the DB stores `'yellow'|'pink'|'blue'|'green'`.
**Decision:** keep the union + DB strings; change only the `--color-tag-*` *values* to the v2 palette (yellow→butter,
green→mint, blue→sky, pink→rose). The configurable accent is a runtime `--color-accent` var set by a client plugin
from the user's `accentColor`, not a DaisyUI theme rebuild. Avoids a churny rename across schema/store/tests.

### D16 — Task `startTime` is a `text 'HH:mm'` label, not scheduling 🔒
**Why:** the app's premise is "no hourly scheduling," but v2 shows optional times. **Decision:** a nullable
`text` column holding `'HH:mm'` (regex-validated) — a tag, no hourly grid. `text` avoids pg `time` serialization
quirks across the JSON boundary.

### D17 — Recurrence: template-is-first-occurrence; subtasks are real scoped rows 🔒
**Why:** the data model reserves `recurrenceRule`/`recurrenceId`/`parentId`. **Decision:** the row carrying the
RRULE *is* the first occurrence (no invisible generator); later instances are real task rows linked by
`recurrenceId`, materialized per visible week and idempotent via a partial unique `(recurrence_id, date)` index.
Subtasks are real rows sharing the parent's scope, filtered from the top level by `parentId IS NULL`. Rollover
skips templates, instances, and subtasks.

### D18 — Calendar secrets: AES-256-GCM stored as base64 `text`; sync is full-replace 🔒-ish
**Why:** D12 mandated encryption + key versioning; storage shape and sync strategy were open. **Decision:**
`cipher`/`iv`/`authTag` as base64 **`text`** (+ `encKeyVersion`) — avoids a Drizzle `bytea` custom type; CalDAV
stores `{username,password}` JSON encrypted, Google a refresh token, iCal the URL. Read-only sync is a
**full-replace** of each calendar's mirrored events per poll (correct + simple); incremental cursors (410/ctag,
in the tested `sync-cursor.ts`) are a wired-later optimization.

---

## Open items to revisit

- **CLA vs DCO** for external contributors (AGPL relicensing needs every contributor's consent without one).
- **Google Calendar scope:** ship `calendar.readonly` now; widen to `calendar.events` when two-way sync lands
  (a second consent screen).
- **ESLint vs Biome:** chose `@nuxt/eslint` for Nuxt-native DX; revisit only if formatting speed becomes a pain.
