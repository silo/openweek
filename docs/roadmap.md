# Roadmap

Build phases, in order. Each phase is shippable and ends green on `pnpm lint && pnpm typecheck && pnpm test`.
The data model (see [data-model.md](./data-model.md)) is built once and up front so later features need **no
migrations**.

## Phase 0 — Foundations & docs
Write the `docs/*.md` set from the plan; add `CLAUDE.md`; correct the fonts line in
[tech-stack.md](./tech-stack.md). Tooling baseline: `package.json` deps + scripts, Nuxt config modules,
Tailwind v4 + token CSS, DaisyUI, ESLint (`@nuxt/eslint`), Vitest, `server/utils/config.ts` (Zod env,
fail-fast), `drizzle.config.ts`, `.env.example`.

## Phase 1 — DB + Auth
Single `pg` Pool → `drizzle()` + Better Auth adapter; app schema + generated auth tables; `drizzle-kit
migrate`. Better Auth: email/password + Google (env-gated) + admin plugin + **first-user-admin** hook. Auth
pages + `auth.global.ts` (guard + first-run redirect). `user_settings` row created on signup.

## Phase 2 — Design system
Tailwind v4 `@theme` + token layer as CSS variables; DaisyUI light **and** dark themes; self-hosted IBM Plex
Mono/Sans (+ optional switcher fonts); primitives (`OwButton`, `OwPill`, `TaskMark`, `ColorSwatch`);
`ThemeControls` wired to settings persistence.

## Phase 3 — Week grid + tasks (core)
`GET /api/week` + optimistic `useWeekStore`; `WeekGrid` / `DayColumn` / `TaskItem`; create / edit / complete /
delete; highlight colors, notes, per-task time; the inline "Write a task" composer; `TaskDetailPopover`.

## Phase 4 — Lists + drawer
List CRUD; auto-created default "Someday" list; `ListDrawer` + tabs; moving a task between a day and a list.

## Phase 5 — Drag & drop
`useTaskBoard` (Pragmatic DnD + `/auto-scroll` + `/hitbox`) — the one swappable engine file; fractional-index
persistence on drop; the keyboard **"Move to…"** menu; full a11y pass.

## Phase 6 — Rollover
`rolloverEnabled` setting; lazy idempotent server rollover on week load; a daily Nitro task using each user's
`timezone`; the `↪` provenance indicator.

## Phase 7 — Calendar sync
`crypto.ts`; `calendar_connection` / `_source` / `_event`; providers (`google` / `caldav` / `ical`) +
`expand` + `store` + `sync` orchestrator + the scheduled poll task; connect flows + calendar settings; events
in the grid; **convert-event → task**.

## Phase 8 — Search + polish
Basic task search (endpoint + UI); empty / loading / error states; a dark-mode pass; the mobile vertical-stack
responsive layout.

## Phase 9 — Docker + self-host
Multi-stage `Dockerfile`; `docker-compose.yml` (app + postgres); entrypoint migrations; `.env.example`;
[self-hosting.md](./self-hosting.md) polish + backups; Playwright e2e; first release.

## Later phases (not scheduled)

The schema already reserves room for these — they are UI/logic work, **not** migrations:

- **Subtasks UI** — the `subtask` table and detail-popover design already exist.
- **Recurring tasks** — materialize `recurrenceRule` into instances (the label UI is designed).
- **Reminders / notifications.**
- **Two-way calendar sync** (write-back).
- **Offline / PWA** — `@vite-pwa/nuxt`; the optimistic data layer is designed to make this additive.
- **Month view** and admin user-management UI.

## Related docs
[decisions.md](./decisions.md) · [architecture.md](./architecture.md) · [testing.md](./testing.md)
