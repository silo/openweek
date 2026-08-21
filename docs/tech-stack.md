# Tech Stack

Final stack for Openweek, with versions (pinned majors as of project start, mid-2026), the reasoning, and an
explicit record of what we evaluated and **rejected**. Choices were verified against live npm/GitHub data.

## Core framework & build

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Framework | Nuxt | 4.5 | Already scaffolded. `app/` srcDir, `shared/`, Nitro `server/`. SSR on. |
| Language | TypeScript (strict) | 6.x | Strict is on by default in the generated tsconfig. Build type-checking is OFF by default → wire `nuxt typecheck` (vue-tsc) in CI. |
| Runtime | Node | **24 LTS** | Pinned by `.nvmrc` / `.node-version` / `engines`, and by `node:24-alpine` in both Dockerfile stages. Held at the active LTS on purpose: corepack — which is how the image gets pnpm — was dropped from Node 25 onward, so moving to Current means changing how the build installs its package manager. |
| Package manager | pnpm | 10.x | Via corepack (`packageManager` in package.json pins the exact version). |
| Fonts | `@fontsource-variable/bricolage-grotesque` + `@fontsource/{open-sans,lato,roboto,inter,source-sans-3}` | 5.x | Self-hosted (offline + privacy + AGPL ethos); the design canvases link Google Fonts, which we do not copy. **Bricolage Grotesque = display** (wordmark, week title, date numerals); the **body face is per-user**, defaulting to Open Sans. No monospace. Supersedes both the earlier Inter+Caveat pick and the IBM Plex monospace one. See [design.md](./design.md) and [decisions.md](./decisions.md). |
| State | Pinia + `@pinia/nuxt` | 4.0 / 1.0 | Single optimistic-mutation store for the week grid. |

## Data & validation

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Database | PostgreSQL | 16+ | |
| ORM | drizzle-orm | 0.45 | Stable 0.x line (Drizzle v1 still beta). |
| Migrations | drizzle-kit | 0.31 | `generate` (commit SQL) + `migrate` on container start. `push` only in local dev. |
| PG driver | pg (node-postgres) | 8.x | Same Pool passed to `drizzle()` and Better Auth's adapter. |
| Validation | Zod | 4.4 | Pinned with drizzle-zod together to avoid a v3/v4 split. |
| Schema derivation | drizzle-zod | 0.8 | Zod-4-aware. Used for **app** tables only. |
| IDs | `uuidv7` | latest | Time-sortable; doubles as the ordering tiebreaker. Better Auth ids stay `text`. |
| Ordering | `fractional-indexing-jittered` | latest | Jitter avoids identical colliding keys under concurrent inserts. Always sort `(position, id)`. |
| Dates | `date-fns` / `date-fns-tz` | 4.x / 3.x | v4 has built-in TZ; the 3-vs-4 version skew is expected. |

## Auth

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Auth | better-auth | 1.7 | Email/password + Google OAuth + **admin** plugin. Healthy, actively maintained. |
| Auth schema CLI | `@better-auth/cli` (via `npx`) | 1.4.x | **Versions independently of `better-auth`**, and lags it — so it does **not** emit 1.7's required `account.issuer` field, which is maintained by hand in the generated file (see the note at the foot of this page). Run `pnpm auth:gen` (→ `npx @better-auth/cli@latest generate`). Commit the output; drizzle-kit owns migrations. |

First-user-becomes-admin via `databaseHooks.user.create.before` (count users; `role: 'admin'` only when zero).

## Drag & drop

| Concern | Choice | Version | Notes |
|---|---|---|---|
| DnD engine | `@atlaskit/pragmatic-drag-and-drop` | 3.x | + `/auto-scroll` + `/hitbox`. v3 renamed the entry points — import per symbol (`/adapter/element-adapter`, `/closest-edge/attach-closest-edge`); the old barrel paths still resolve but are deprecated shims. Framework-agnostic; real keyboard/screen-reader story. |
| Vue binding | our own `useTaskBoard` composable | — | Pragmatic ships no official Vue adapter; we write a thin composable so the engine is swappable in one file. |

Always pair DnD with a **non-drag "move to…" menu** (also the keyboard path). On drop, compute
`generateKeyBetween(prev, next)` and persist via the store.

## Calendar sync

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Google client | `@googleapis/calendar` | 16 | 811 KB vs the 207 MB `googleapis` umbrella. Official typings. |
| Google auth | `google-auth-library` | 11 | OAuth code exchange + token refresh for the dedicated "connect calendar" flow. |
| CalDAV | `tsdav` | 2.2 | Apple/Nextcloud/Fastmail; `sync-collection`/ctag/etag; app-specific passwords. |
| Recurrence expansion | `ical.js` | 2.2 | Handles VTIMEZONE/EXDATE/RDATE/RECURRENCE-ID — not just the RRULE string. |
| Sync trigger | Nitro scheduled task (poll) | — | Not Google push/watch (needs public HTTPS callback most self-hosters lack). |

## Tooling & ops

| Concern | Choice | Notes |
|---|---|---|
| Lint/format | `@nuxt/eslint` | Nuxt-native flat config + stylistic formatting. |
| Type-check | vue-tsc via `nuxt typecheck` | Blocking CI gate — strict errors don't fail the default build otherwise. |
| Tests | Vitest + `@nuxt/test-utils` + `@vue/test-utils` + happy-dom | Playwright added later for e2e DnD. |
| Encryption | `node:crypto` (AES-256-GCM) | No dependency. Per-record IV + auth tag + `encKeyVersion`. |
| Container | Docker + Docker Compose | app + postgres, named volume. |
| Offline (later) | `@vite-pwa/nuxt` | Not in v1; data layer is designed so it's additive. |

## Rejected, and why

| Rejected | Reason | Used instead |
|---|---|---|
| `vuedraggable@next` | Abandoned — last release 2021, repo dormant since 2023; no Vue 3.5/Nuxt 4 verification; weak a11y. | `@atlaskit/pragmatic-drag-and-drop` |
| `@nuxtjs/tailwindcss` | Built around the Tailwind v3 `tailwind.config.js` model; not the supported v4 path. | `@tailwindcss/vite` |
| `googleapis` (umbrella) | 207 MB unpacked — bloats the self-host Docker image for no benefit. | `@googleapis/calendar` (811 KB) |
| `rrule` | Unmaintained since 2023; only parses the RRULE string, ignores VTIMEZONE/EXDATE/RECURRENCE-ID. | `ical.js` |
| Google push/watch | Needs a public CA-valid HTTPS callback + channel renewal; impractical for typical self-hosts. | Polling via Nitro scheduled task |
| Lucia (auth) | Officially deprecated (sunset to a guide in 2025). | Better Auth |
| tRPC | Duplicates Nitro's routing/runtime and fights Better Auth's route mounting; no gain in a single app. | Typed `$fetch`/`useFetch` + shared Zod |
| Google Fonts CDN | Third-party network dependency at runtime; bad for self-host/privacy. | Self-hosted `@fontsource/*` |
| Chart.js / d3 / unovis | The Stats page needs a bar, a grid of squares and a split rule; a chart library brings its own theming model to fight with the `--ow-*` token layer, for marks that are a few lines of SVG. | Hand-rolled inline SVG/CSS in `app/components/stats/` |
| plain `fractional-indexing` | Identical colliding keys on concurrent same-slot inserts (multi-device risk). | `fractional-indexing-jittered` + uuid v7 tiebreaker |

## Version-coupling notes

- **Zod 4 + drizzle-zod 0.8.x** must be pinned together; a v3/v4 split surfaces as confusing type errors. Add
  a smoke test that imports a generated schema and parses a sample row so a future bump fails in CI.
- **`@better-auth/cli` versions independently of `better-auth`** (the CLI lags — there is no matching 1.6
  release; latest is 1.4.x). Invoke via `pnpm auth:gen`
  (`npx @better-auth/cli@latest generate --config server/utils/auth.ts --output server/database/schema/auth.ts`).
  Re-run whenever an auth plugin/field changes, then `drizzle-kit generate`/`migrate`.
- DnD libs and several Nuxt modules are pre-1.0 (`@nuxt/fonts`, etc.) — pin exact versions where load-bearing.

### Everything is on latest, except TypeScript

- **`typescript` held at `^6.0.3`** — the line Nuxt itself develops against (it is Nuxt 4.5.2's own
  devDependency; Nuxt declares no `typescript` dependency or peer, so nothing is imposed on us). **TypeScript 7**
  (the Go port) is the one package that cannot be taken: it breaks `vue-tsc`, the blocking typecheck gate, with
  `ERR_PACKAGE_PATH_NOT_EXPORTED` resolving tsc's own path, and `typescript-eslint` excludes it by peer range
  (`>=4.8.4 <6.1.0`). Retry when both ship support — `pnpm typecheck` is the test.

Two upgrades cost something and were taken anyway, with eyes open:

- **Nuxt 4.5 moves the build from Vite 7 to Vite 8**, which costs about **240 MB of build memory**: peak RSS
  goes ~865 MB → ~1.05 GB. A 1 GB host used to build with ~150 MB to spare and now needs **swap** — with it,
  everything from 512 MB up still builds. Measured on 4.5.0 and 4.5.2 alike. If a self-hoster reports a build
  killed at `exit code: 137`, this is why: [self-hosting.md](./self-hosting.md#building-on-a-small-host).
- **better-auth 1.7 added a required `issuer` field on `account`** and matches on it when resolving the
  credential account at sign-in, so every pre-1.7 row stopped authenticating (`[Better Auth]: User not found`,
  with the rows plainly there). Migration `0008` adds the column and backfills better-auth's own synthetic
  issuers — `local:<providerId>` for credentials, `local:oauth:<providerId>` for OAuth. **`pnpm auth:gen` does
  not emit this field**, because `@better-auth/cli` lags the library, so the column is maintained by hand in
  `server/database/schema/auth.ts` — keep it when regenerating.
