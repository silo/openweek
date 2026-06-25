# Tech Stack

Final stack for Openweek, with versions (pinned majors as of project start, mid-2026), the reasoning, and an
explicit record of what we evaluated and **rejected**. Choices were verified against live npm/GitHub data.

## Core framework & build

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Framework | Nuxt | 4.4 | Already scaffolded. `app/` srcDir, `shared/`, Nitro `server/`. SSR on. |
| Language | TypeScript (strict) | 5.x | Strict is on by default in the generated tsconfig. Build type-checking is OFF by default → wire `nuxt typecheck` (vue-tsc) in CI. |
| Package manager | pnpm | 10.x | |
| Styling | Tailwind CSS | 4.3 | v4 is CSS-first (`@import "tailwindcss"`, `@theme`/`@plugin` in CSS). No `tailwind.config.js`. |
| Tailwind integration | `@tailwindcss/vite` | 4.3 | Added as a Vite plugin in `nuxt.config`. **Not** `@nuxtjs/tailwindcss`. |
| Component/theme layer | DaisyUI | 5.5 | Only v4-compatible major. Used for theme tokens + dark mode + overlay/form primitives; grid is custom. |
| Fonts | `@fontsource/inter`, `@fontsource/caveat` | 5.x | Self-hosted (offline + privacy + AGPL ethos). Inter = body, Caveat = logo/day-label accent. |
| State | Pinia + `@pinia/nuxt` | 3.0 / 0.11 | Single optimistic-mutation store for the week grid. |

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
| Auth | better-auth | 1.6 | Email/password + Google OAuth + **admin** plugin. Healthy, actively maintained. |
| Auth schema CLI | `@better-auth/cli` | 1.6 | `generate` emits Drizzle auth tables (incl. plugin fields); commit them. drizzle-kit owns migrations. |

First-user-becomes-admin via `databaseHooks.user.create.before` (count users; `role: 'admin'` only when zero).

## Drag & drop

| Concern | Choice | Version | Notes |
|---|---|---|---|
| DnD engine | `@atlaskit/pragmatic-drag-and-drop` | 2.x | + `/auto-scroll` + `/hitbox`. Framework-agnostic; real keyboard/screen-reader story. |
| Vue binding | our own `useTaskBoard` composable | — | Pragmatic ships no official Vue adapter; we write a thin composable so the engine is swappable in one file. |

Always pair DnD with a **non-drag "move to…" menu** (also the keyboard path). On drop, compute
`generateKeyBetween(prev, next)` and persist via the store.

## Calendar sync

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Google client | `@googleapis/calendar` | 15 | 811 KB vs the 207 MB `googleapis` umbrella. Official typings. |
| Google auth | `google-auth-library` | 10 | OAuth code exchange + token refresh for the dedicated "connect calendar" flow. |
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
| plain `fractional-indexing` | Identical colliding keys on concurrent same-slot inserts (multi-device risk). | `fractional-indexing-jittered` + uuid v7 tiebreaker |

## Version-coupling notes

- **Zod 4 + drizzle-zod 0.8.x** must be pinned together; a v3/v4 split surfaces as confusing type errors. Add
  a smoke test that imports a generated schema and parses a sample row so a future bump fails in CI.
- **`@better-auth/cli` pinned to the same version as `better-auth`.** Re-run `generate` whenever an auth
  plugin/field changes, then `drizzle-kit generate`/`migrate`.
- DnD libs and several Nuxt modules are pre-1.0 (`@nuxt/fonts`, etc.) — pin exact versions where load-bearing.
