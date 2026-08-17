# Architecture

How Openweek is laid out: folders, layers, data flow, and the state model. Openweek is a single **Nuxt 4**
app (SSR on) with a Nitro back-end, one Postgres, and no external services at runtime beyond the calendars a
user chooses to connect.

## Layers at a glance

```
Browser ──$fetch/useFetch (typed by shared Zod)──▶ Nitro /server/api ──▶ services ──▶ Drizzle ──▶ Postgres
   │                                                     │
 Pinia (optimistic week store)                     Better Auth (session cookie)
   │                                                     │
 Vue components (the paper grid)                   Nitro scheduled tasks (poll sync, daily rollover)
```

- **One source of truth per concern.** The visible week lives in a single Pinia store on the client and in
  Postgres on the server. The API is thin: validate → service → DB → typed JSON.
- **Typed end-to-end without tRPC.** Request/response shapes are **Zod schemas in `shared/`**, imported by both
  the endpoint (to `parse()` input) and the client (to type the call). tRPC was rejected — it duplicates
  Nitro's routing and fights Better Auth's mounting.

## Directory structure (Nuxt 4 three-root model)

```
app/                      # front-end (srcDir)
  pages/                  # index.vue (the week), login/register, settings/*
  components/             # TopBar, WeekGrid, DayColumn, TaskItem, EventItem,
                          #   TaskDetailPopover, ConvertEventPopover, ListDrawer, ThemeControls, primitives
  stores/                 # Pinia: useWeekStore (optimistic), useUiStore, useSettingsStore
  composables/            # useTaskBoard (DnD), useWeek (date math), useAuthClient, useTheme
  middleware/             # auth.global.ts — guard + first-run redirect
  plugins/                # theme init, DnD auto-scroll registration
  assets/css/             # Tailwind v4 entry + token layer (CSS variables)
server/                   # Nitro back-end
  api/                    # week.get, tasks/*, lists/*, calendars/*, events/[id]/convert, me/settings, search
  routes/api/auth/[...all].ts   # Better Auth handler mount
  database/
    client.ts             # single pg Pool → drizzle() AND Better Auth adapter
    schema/               # app tables + committed generated auth tables
    migrations/           # drizzle-kit SQL (committed)
  utils/                  # auth.ts, config.ts (Zod env, fail-fast), crypto.ts (AES-256-GCM)
  services/               # ordering.ts, rollover.ts, calendar/{google,caldav,ical,expand,store,sync}.ts
  tasks/                  # Nitro scheduled: calendar-sync.ts, rollover.ts
shared/                   # schemas/ (Zod contract), constants/ (colors, sources), types/
```

Root: `drizzle.config.ts`, `Dockerfile`, `docker-compose.yml`, `.env.example`, `eslint.config.mjs`,
`vitest.config.ts`, `CLAUDE.md`.

## Request lifecycle

1. **SSR** renders `index.vue` for the current week. The server resolves the session, fetches the week's tasks
   + lists + cached calendar events, and hydrates `useWeekStore`.
2. **Client mutations** call typed endpoints. Every write endpoint `parse()`s its body with a shared Zod
   schema, checks the session (owner scoping — every row is filtered by `userId`), runs a service, returns the
   updated row.
3. **Reads** for other weeks go through `GET /api/week?start=YYYY-MM-DD`.

## State model (client)

- **`useWeekStore`** is the single **optimistic-mutation** store for the grid. On a user action it updates
  local state immediately, fires the request, and **rolls back on error** (restoring the pre-mutation
  snapshot and surfacing a toast). This keeps the paper grid feeling instant.
- **Ordering** is a fractional `position` string per task within its bucket (a day-date *or* a list). On drop
  the store computes `generateKeyBetween(prev, next)` (`fractional-indexing-jittered`) and persists; lists are
  always sorted `(position, id)` where `id` is a uuidv7 (time-sortable tiebreaker, so concurrent inserts never
  truly collide). See [data-model.md](./data-model.md).
- **No realtime in v1.** Multi-device convergence relies on uuidv7 + jitter and a refetch-on-window-focus; a
  websocket/live layer is an additive later concern.

## API surface (typed `$fetch` + shared Zod)

| Method & path | Purpose |
|---|---|
| `GET /api/week?start=` | Week payload: days → tasks, imported events, lists. |
| `POST /api/tasks` · `PATCH /api/tasks/:id` · `DELETE /api/tasks/:id` | Create / edit-complete-move-color-time-note / delete. |
| `GET/POST /api/lists` · `PATCH/DELETE /api/lists/:id` | List CRUD. |
| `GET /api/calendars` · `POST /api/calendars` · `DELETE /api/calendars/:id` · `POST /api/calendars/:id/sync` | Connections + manual sync. |
| `GET /api/calendars/google/callback` | Google OAuth (calendar.readonly) return. |
| `POST /api/events/:id/convert` | Turn an imported event into a task (optionally keep-linked). |
| `GET/PATCH /api/me/settings` | Per-user settings (theme, week-start, rollover, tz). |
| `GET /api/search?q=` | Basic task search. |
| `/api/auth/**` | Better Auth (email/password, Google, admin). |

## Auth & authorization

- **Better Auth** server instance in `server/utils/auth.ts`: `emailAndPassword`, Google `social` provider
  (only registered when `GOOGLE_CLIENT_ID/SECRET` are present), and the **admin** plugin.
- **First user becomes admin** via `databaseHooks.user.create.before` — it counts users and sets
  `role: 'admin'` only when the count is zero.
- Auth tables are generated by `@better-auth/cli generate` and **committed**; **drizzle-kit owns migrations**
  (auth CLI never migrates). Keep `@better-auth/cli` pinned to `better-auth`.
- Every app endpoint scopes queries by the session `userId`; `auth.global.ts` redirects unauthenticated users
  to `/login` (or `/register` when there are zero users).

## Config & boot

`server/utils/config.ts` validates env with Zod at process start and **fails fast** with a readable message
(the README promises this). It also validates `OPENWEEK_ENCRYPTION_KEY` decodes to exactly 32 bytes. See
[self-hosting.md](./self-hosting.md).

## Background work

Two Nitro **scheduled tasks** (registered via `nitro.scheduledTasks`; polling, not push): `calendar-sync`
every `OPENWEEK_SYNC_INTERVAL` (default 15m) and a daily `rollover`. Both are idempotent and guarded against
overlapping runs. Details in [calendar-sync.md](./calendar-sync.md).

## Related docs
[data-model.md](./data-model.md) · [calendar-sync.md](./calendar-sync.md) · [design.md](./design.md) ·
[testing.md](./testing.md) · [decisions.md](./decisions.md)
