<div align="center">

# 🗓️ Openweek

**A free, open-source, self-hostable weekly planner.**

A calm, paper-planner week grid for your tasks — drag them around, check them off, color-tag them.
An open alternative to [tweek.so](https://tweek.so), [teuxdeux.com](https://teuxdeux.com), and
[weektodo.me](https://weektodo.me), built to self-host.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
![Status: early development](https://img.shields.io/badge/status-early%20development-orange)
![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)

</div>

---

## Summary

Openweek is a **minimalist weekly to-do app**. The whole interface is a **week grid**: seven day columns plus
"Someday" lists, where each task is a bullet you can drag between days, tick off, tag with a highlighter
color, and annotate. There's **no hourly scheduling** — the week itself is the canvas. It's designed to feel
like a paper planner, not a SaaS dashboard: warm cream background, hairline rules, generous whitespace.

It's **AGPL-3.0** and **self-host first** — your tasks live in your own Postgres, in your own container.

## Features

- 🗒️ **Week grid** — 7 day columns + "Someday" lists; previous / next / this-week navigation.
- ✅ **Tasks** — create, edit, complete, color-tag, and add notes.
- 🔀 **Drag & drop** — reorder within a day/list and move tasks across days; **fully keyboard-accessible**,
  with a non-drag "move to…" menu as well.
- ↪️ **Auto-rollover** *(opt-in)* — unfinished past tasks roll forward to today; the original date is kept.
- 📅 **Calendar sync** *(read-only)* — mirror **Google Calendar, CalDAV** (Apple/Nextcloud/Fastmail), and
  **iCal feeds** into your week. Connect multiple accounts; tokens are encrypted at rest.
- 🔐 **Accounts** — email/password + optional Google sign-in. The **first user to register becomes the admin**.
- 🎨 **Paper aesthetic** — custom theme with light + dark modes.
- 🐳 **Self-hostable** — one `docker compose up`.

> Not yet: recurring tasks, reminders, two-way calendar sync, and offline/PWA — these are
> [planned for later](./docs/roadmap.md#later-phases-not-scheduled). The data model already leaves room for them.

## Tech stack

[Nuxt 4](https://nuxt.com) · TypeScript · [PostgreSQL](https://www.postgresql.org) +
[Drizzle ORM](https://orm.drizzle.team) · [Zod](https://zod.dev) · [Tailwind CSS v4](https://tailwindcss.com) +
[DaisyUI](https://daisyui.com) · [Better Auth](https://better-auth.com) ·
[Pragmatic drag-and-drop](https://github.com/atlassian/pragmatic-drag-and-drop) · Docker.
Full list and rationale: [docs/tech-stack.md](./docs/tech-stack.md).

---

## Quick start (self-host with Docker)

The fastest way to run Openweek. Requires Docker + Docker Compose.

```bash
# 1. Clone
git clone https://github.com/your-org/openweek.git
cd openweek

# 2. Configure
cp .env.example .env
#    then edit .env — at minimum set the secrets (see "Configuration" below)

# 3. Run (app + postgres)
docker compose up -d

# 4. Open
#    http://localhost:3000  — the first account you register becomes the admin
```

Migrations run automatically on container start. To update later: `git pull && docker compose up -d --build`.

📖 Full self-hosting guide — reverse proxy, backups, all env vars: **[docs/self-hosting.md](./docs/self-hosting.md)**.

## Configuration

Set these in `.env` (generate secrets with `openssl rand -base64 32`):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string. |
| `BETTER_AUTH_SECRET` | ✅ | Signs sessions. |
| `BETTER_AUTH_URL` | ✅ | Your public URL (e.g. `https://openweek.example.com`). |
| `OPENWEEK_ENCRYPTION_KEY` | ✅ | Base64 of 32 bytes — encrypts calendar tokens at rest. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Google sign-in and/or Google Calendar sync. |

The app **validates its config at boot** and fails fast with a clear message if something is missing.

## Local development

For working on Openweek itself. Requires Node 22+, [pnpm](https://pnpm.io), and a Postgres (the compose file
can provide one).

```bash
pnpm install

# Start just the database from the compose stack
docker compose up -d db

# Apply the schema
pnpm db:migrate

# Run the dev server at http://localhost:3000
pnpm dev
```

Other scripts:

```bash
pnpm typecheck     # vue-tsc strict type-check
pnpm lint          # ESLint
pnpm test          # Vitest (see docs/testing.md)
pnpm test:coverage # Vitest with a coverage report
pnpm db:generate   # generate a migration after editing the schema
pnpm auth:gen      # regenerate Better Auth tables after auth config changes
pnpm build         # production build
```

> Building features in order? Follow the phases in [docs/roadmap.md](./docs/roadmap.md), and keep
> [`CLAUDE.md`](./CLAUDE.md) + [`/docs`](./docs/README.md) in sync as the stack evolves.

## Documentation

| Doc | What's in it |
|---|---|
| [docs/README.md](./docs/README.md) | Documentation index. |
| [docs/tech-stack.md](./docs/tech-stack.md) | Dependencies, versions, and what we rejected and why. |
| [docs/architecture.md](./docs/architecture.md) | Folders, layers, data flow, state model. |
| [docs/data-model.md](./docs/data-model.md) | Database schema and constraints. |
| [docs/calendar-sync.md](./docs/calendar-sync.md) | How calendar connections and sync work. |
| [docs/design.md](./docs/design.md) | The paper aesthetic, theme, accessibility, responsive layout. |
| [docs/self-hosting.md](./docs/self-hosting.md) | Operations: env, Docker, backups, reverse proxy. |
| [docs/roadmap.md](./docs/roadmap.md) | Build phases and scope. |
| [docs/decisions.md](./docs/decisions.md) | Why key choices were made. |

## Contributing

Contributions are welcome. Openweek is in early development, so the most useful help right now is feedback on
the [plan](./docs/roadmap.md) and [decisions](./docs/decisions.md). Before opening a PR, please run
`pnpm lint && pnpm typecheck && pnpm test`. (A `CONTRIBUTING.md` will follow with the first release.)

## License

[AGPL-3.0](./LICENSE). You can self-host and modify Openweek freely; if you run a modified version as a network
service, the AGPL requires you to offer your users the modified source. This is deliberate — so hosted forks
stay open.
