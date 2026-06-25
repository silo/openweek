# Calendar Sync

Openweek mirrors external calendars **read-only** into the week grid (foundation phase). The layer is
architected so two-way sync can be added later without reshaping data. Connecting a calendar is **independent
of how you log in** — an email/password user can connect Google, CalDAV, and iCal sources.

## Scope

- **v1 (now):** connect Google / CalDAV / iCal, pull events, display them read-only alongside tasks; recurrence
  expanded for the visible week. Encrypted token storage. Polling sync.
- **Later:** two-way push (create/edit/delete external events from Openweek). The schema below already carries
  what push needs (series masters, RRULE, RECURRENCE-ID).

## Providers (unified `connected_accounts`)

One store, three provider types — this is the user's chosen model (multiple Google accounts + CalDAV + iCal):

| Provider | Connect method | Stored secret | Sync API |
|---|---|---|---|
| `google` | **Dedicated OAuth** "connect calendar" flow (separate from login) via `google-auth-library`, scope `calendar.readonly` + offline access | encrypted **refresh token** | `@googleapis/calendar` `events.list` with `syncToken` |
| `caldav` | Server URL + username + **app-specific password** via `tsdav` | encrypted password | `sync-collection` (syncToken) → ctag/etag fallback |
| `ical` | A public/private `.ics` URL | the URL (stored encrypted for consistency) | HTTP GET + ETag/Last-Modified |

> Google login (Better Auth) and Google **calendar** connection are deliberately separate concerns. Login
> identity lives in Better Auth's `account` table; calendar data sources live in `connected_accounts`. This
> keeps the sync architecture uniform across all three providers and supports connecting a *different* Google
> account than the one you logged in with, or several.

## Tables

### `connected_accounts`
One credentialed external account.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid v7 | PK |
| `userId` | text | → `user.id` (cascade) |
| `provider` | enum `google\|caldav\|ical` | |
| `label` | text | user-facing name |
| `cipher` / `iv` / `authTag` | bytea/text | AES-256-GCM encrypted secret (refresh token / password / url) |
| `encKeyVersion` | int | which encryption key encrypted this row (rotation) |
| `caldavUrl` | text? | CalDAV server base URL |
| `icalUrl` | text? | iCal feed URL (non-secret copy for display; secret copy encrypted) |
| `createdAt` | timestamptz | |
| `lastSyncedAt` | timestamptz? | |

### `external_calendars`
A single calendar within an account (a Google account has many; CalDAV a few; iCal one). Lets the user pick
which calendars to mirror and onto which board to display them.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid v7 | PK |
| `connectedAccountId` | uuid | → `connected_accounts.id` (cascade) |
| `externalCalendarId` | text | provider's calendar id |
| `name` / `color` | text | |
| `enabled` | bool | show in the grid? |
| `boardId` | uuid? | which board to display on; defaults to the user's default board |
| `syncToken` / `ctag` | text? | incremental-sync cursors |
| `lastSyncedAt` | timestamptz? | |

### `synced_events`
Read-only mirror. **Store series masters + overrides; expand the visible week on read** (don't persist every
occurrence). This keeps the table small, makes prev/next-week navigation correct without a re-sync, and
preserves what two-way sync needs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid v7 | PK |
| `externalCalendarId` | uuid | → `external_calendars.id` (cascade) |
| `uid` | text | external UID |
| `recurrenceId` | text? | identifies an overridden single instance (RECURRENCE-ID) |
| `title` | text | |
| `start` / `end` | timestamptz | stored UTC |
| `startTz` / `endTz` | text | original IANA tz id (DST-correct display) |
| `allDay` | bool | |
| `rrule` | text? | series rule |
| `exdates` | jsonb? | cancelled occurrences (EXDATE) |
| `seriesUid` | text? | links instances ↔ series |
| `isMaster` | bool | master vs override row |
| `status` | enum `confirmed\|cancelled` | surfaces CANCELLED/EXDATE |
| `lastSeenAt` / `updatedAt` | timestamptz | |

Why not a flat one-row-per-occurrence mirror: it can't represent a recurring series, a cancelled occurrence,
or a single modified instance — exactly the cases that make a mirrored calendar look wrong.

## Recurrence expansion

Use **`ical.js`** `RecurExpansion` (handles VTIMEZONE / EXDATE / RDATE / RECURRENCE-ID / all-day). Expand only
the **7-day window** the grid is showing; cache an occurrence cursor per series (ical.js iterates forward from
DTSTART). Do **not** rely on server-side `expand=` (optional, inconsistent across CalDAV providers) or
Google's `singleEvents=true` (loses the RRULE needed for later two-way edits) — fetch masters and expand
ourselves for symmetry across providers.

## Sync execution

- A **Nitro scheduled task** (`server/tasks/sync.ts`, croner engine) runs every ~10 min on the `node-server`
  preset, in-process in the single app container — no external queue. Plus an on-demand **"Sync now"** route.
- **Incremental:** Google `events.list({ syncToken })`; CalDAV `sync-collection`. On **HTTP 410 Gone** (Google)
  or an invalid sync token (CalDAV), discard the cursor and do a **windowed full resync**, then store the new
  cursor. iCal uses ETag/Last-Modified.
- **Polling, not push** — see [tech-stack.md](./tech-stack.md#rejected-and-why).
- Requires a **persistently running** container (not scale-to-zero). On multi-replica deploys, run sync as a
  leader/one-shot step so two replicas don't double-poll and hit rate limits.

## Token encryption at rest

All provider secrets are encrypted with **AES-256-GCM** (`node:crypto`, no dependency):

- Key: **32 raw bytes**, supplied base64 via `OPENWEEK_ENCRYPTION_KEY`; **validated at boot** (fail fast if
  missing/wrong length).
- Per record: a **fresh random 12-byte IV** (never reuse with the same key); store `cipher`, `iv`, `authTag`
  separately.
- **Rotation:** `encKeyVersion` column + a `{version: key}` map so old rows decrypt with the old key while new
  writes use the current key; re-encrypt lazily on next sync. Designed in from day one — painful to retrofit.
- **Always store the refresh token** (the long-lived secret); access tokens are short-lived and re-derived.

## Known footguns (documented for implementers)

- **Google refresh token:** request `access_type=offline` and force `prompt=consent`, or Google omits the
  refresh token on repeat consents and background sync dies after ~1h.
- **Google client ceiling:** 100 refresh tokens per account per OAuth client id; relevant for large
  multi-user self-host instances sharing one client.
- **CalDAV providers differ** (iCloud/Nextcloud/Fastmail) — iCloud/Fastmail need app-specific passwords; lean
  on ctag/etag when `sync-collection` is unavailable.
