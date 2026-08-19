# Self-hosting

Openweek is **self-host first**: your tasks and encrypted calendar credentials live in your own Postgres, in
your own container. One `docker compose up` runs the app + database.

> **Step-by-step install guides — Docker Compose, Portainer, and Proxmox (LXC or VM) — are in the
> [root README](../README.md#self-hosting).** This page is the operational detail behind them: every variable,
> what the container actually does, reverse proxying, and backups.

There is **no prebuilt image published yet**, so every route builds from a clone of the repository. The first
build runs a full Nuxt production build and takes several minutes.

```bash
git clone https://github.com/silo/openweek.git && cd openweek
cp .env.example .env          # then fill in the secrets below
docker compose up -d --build  # app + postgres; migrations run on start
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

These are read by the app itself. Compose additionally reads a few of its own from the same `.env`:

| Variable | Purpose |
|---|---|
| `POSTGRES_PASSWORD` | Password for the bundled Postgres (default `openweek`). Feeds both the `db` service and the app's `DATABASE_URL`. **Only applied when the data directory is first initialised** — set it before the first `up`, or change it afterwards with `docker compose exec db psql -U openweek -c "ALTER USER openweek PASSWORD '…'"` and update `.env` to match. |
| `OPENWEEK_PORT` | Host port published for the app (default `3000`). |
| `OPENWEEK_DB_PORT` | Host port published for Postgres, on `127.0.0.1` only (default `5432`). |

## Container & runtime

- **Dockerfile** — multi-stage: a build stage runs `pnpm install --frozen-lockfile` + `pnpm build` (→
  `.output`); a slim runtime stage (`node:22-alpine`, **non-root** `openweek` user) carries `.output`, the
  committed migration SQL, and a small migration runner. Nitro `node-server` preset; start command
  `node .output/server/index.mjs`.
- **Entrypoint** (`docker/entrypoint.sh`) — apply migrations via `docker/migrate.mjs` (drizzle-orm's migrator
  against the committed SQL, so `drizzle-kit` and the dev toolchain stay out of the runtime image) → start the
  server. Migrations therefore apply automatically on every container start; `drizzle-kit push` is dev-only and
  never used in production.
- **docker-compose.yml** — `app` + `db` (`postgres:16-alpine`) with a **named volume** (`openweek-db`) for
  data, a db healthcheck, and `app` `depends_on: { db: { condition: service_healthy } }`. The app is built from
  the checkout (`build: .`); there is no published image to pull.

### Pointing at an existing Postgres

There is no `external-db` compose profile. To use a managed or already-running database, run only the app
service and override its connection string — for example in a `docker-compose.override.yml`:

```yaml
services:
  app:
    environment:
      DATABASE_URL: postgres://user:password@db.internal:5432/openweek
```

then `docker compose up -d --build app`. The entrypoint migrates whatever `DATABASE_URL` points at, so the
target only needs to be an empty database the user can create tables in.

## Reverse proxy

Set `BETTER_AUTH_URL` to your public HTTPS URL and forward the proxy headers — sessions and OAuth redirects are
derived from the public origin, so a mismatch shows up as a login that silently bounces back to the form.

Caddy (automatic HTTPS) is the simplest:

```
openweek.example.com {
    reverse_proxy openweek-app-1:3000
}
```

nginx:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Traefik, as labels on the `app` service:

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.openweek.rule=Host(`openweek.example.com`)
  - traefik.http.routers.openweek.tls.certresolver=letsencrypt
  - traefik.http.services.openweek.loadbalancer.server.port=3000
```

All three must pass `Host` and `X-Forwarded-Proto`. If the proxy runs in another compose stack, put both on a
shared external network and drop the app's published `ports:` so it is only reachable through the proxy.

## Backups

- **Database** — `pg_dump` on a cron, or snapshot the named volume:
  ```bash
  docker compose exec db pg_dump -U openweek openweek > openweek-$(date +%F).sql
  ```
- **Encryption key** — back up `OPENWEEK_ENCRYPTION_KEY` separately. ⚠️ **If you lose it, stored calendar
  credentials cannot be decrypted** and every user must reconnect their calendars. Task data is unaffected.
- **Restore** — recreate `.env` (same secrets), `docker compose up -d --build`, then
  `docker compose exec -T db psql -U openweek openweek < dump.sql`.
- **Hypervisor snapshots are not a substitute.** A Proxmox/PBS snapshot of a running guest captures the
  Postgres data directory mid-write. Keep taking dumps; use the snapshot for the OS and config around them.

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
