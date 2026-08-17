# Self-hosting

Openweek is **self-host first**: your tasks and encrypted calendar credentials live in your own Postgres, in
your own container. One `docker compose up` runs the app + database.

## Quick start

```bash
git clone https://github.com/your-org/openweek.git && cd openweek
cp .env.example .env          # then fill in the secrets below
docker compose up -d          # app + postgres; migrations run on start
# open http://localhost:3000  — the first account you register becomes the admin
```

Update later: `git pull && docker compose up -d --build` (migrations re-run automatically).

## Configuration

`server/utils/config.ts` validates the environment with Zod at boot and **fails fast** with a clear message if
anything required is missing or malformed. Generate secrets with `openssl rand -base64 32`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string. |
| `BETTER_AUTH_SECRET` | ✅ | Signs sessions. |
| `BETTER_AUTH_URL` | ✅ | Public URL, e.g. `https://openweek.example.com`. |
| `OPENWEEK_ENCRYPTION_KEY` | ✅ | **base64 of exactly 32 bytes** — encrypts calendar tokens at rest. Validated at boot. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Enables Google sign-in and/or Google Calendar sync. |
| `OPENWEEK_SYNC_INTERVAL` | optional | Calendar poll interval (default `15m`). |
| `OPENWEEK_EVENT_WINDOW` | optional | Event cache window (default `-1w..+6w`). |
| `TZ` | optional | Container timezone default. |

## Container & runtime

- **Dockerfile** — multi-stage: a build stage runs `pnpm install --frozen-lockfile` + `nuxt build` (→
  `.output`); a slim runtime stage (`node:22-alpine`, **non-root** user) carries only `.output`. Nitro
  `node-server` preset; start command `node .output/server/index.mjs`.
- **Entrypoint** — validate config → run **`drizzle-kit migrate`** → start the server. Migrations therefore
  apply automatically on every container start; `push` is dev-only and never used in production.
- **docker-compose.yml** — `app` + `db` (`postgres:16`) with a **named volume** for data, a db healthcheck, and
  `app` `depends_on: { db: { condition: service_healthy } }`. An optional `external-db` profile skips the
  bundled Postgres for those pointing at a managed database.

## Reverse proxy

Set `BETTER_AUTH_URL` to your public HTTPS URL and forward proxy headers. Caddy (automatic HTTPS) is the
simplest:

```
openweek.example.com {
    reverse_proxy app:3000
}
```

nginx and Traefik snippets are provided in the compose comments; all three must pass
`X-Forwarded-Proto`/`Host` so sessions and OAuth redirects resolve to the public origin.

## Backups

- **Database** — `pg_dump` on a cron, or snapshot the named volume:
  ```bash
  docker compose exec db pg_dump -U openweek openweek > openweek-$(date +%F).sql
  ```
- **Encryption key** — back up `OPENWEEK_ENCRYPTION_KEY` separately. ⚠️ **If you lose it, stored calendar
  credentials cannot be decrypted** and every user must reconnect their calendars. Task data is unaffected.
- **Restore** — recreate `.env` (same secrets), `docker compose up -d`, then `psql < dump.sql`.

## First run & admin

The **first registered user becomes the admin** (`role: 'admin'`, set by a Better Auth `databaseHooks` hook
when the user count is zero). Later users are regular members. Admin user-management arrives with the admin UI
(see [roadmap.md](./roadmap.md)).

## License note (AGPL-3.0)

If you run a **modified** Openweek as a network service, the AGPL requires you to offer your users the modified
source. The app footer carries a source link + version to satisfy this; keep it pointing at your fork if you
change the code.

## Related docs
[architecture.md](./architecture.md) (config & boot) · [calendar-sync.md](./calendar-sync.md) (key handling) ·
[tech-stack.md](./tech-stack.md)
