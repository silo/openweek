# Calendar sync

Openweek mirrors external calendars **read-only** into the week grid. It never writes back (two-way sync is a
later, out-of-scope concern). Connect multiple accounts across three providers; events are cached in Postgres
and refreshed by polling.

## Why polling, not push

Google's push/watch channels need a **public, CA-valid HTTPS callback** plus periodic channel renewal —
impractical for the typical self-host behind a home network or reverse proxy. So Openweek **polls** on a Nitro
scheduled task. `rrule` was also rejected: it only parses the RRULE string and ignores
VTIMEZONE/EXDATE/RDATE/RECURRENCE-ID. We use **`ical.js`** for correct expansion.

## Providers (`server/services/calendar/`)

| File | Provider | Library | Incremental strategy |
|---|---|---|---|
| `google.ts` | Google Calendar | `@googleapis/calendar` + `google-auth-library` | `events.list` with `singleEvents=true`, `timeMin/timeMax` window, persisted `nextSyncToken`. Google expands recurrence server-side — **no ical.js needed here**. |
| `caldav.ts` | Apple / Nextcloud / Fastmail | `tsdav` | `sync-collection` + `ctag`/`etag`; app-specific passwords. |
| `ical.ts` | public `.ics` feeds | `fetch` | conditional GET with `ETag` / `If-Modified-Since`. |
| `expand.ts` | CalDAV + iCal ICS | `ical.js` | expand recurrence **within the window**, honoring VTIMEZONE / EXDATE / RDATE / RECURRENCE-ID. |
| `store.ts` | — | Drizzle | upsert into `calendar_event`, dedupe `(sourceId, remoteUid, startAt)`, compute `localDate`/`timeLabel` in the user's tz, drop cancelled/removed, prune outside the window. |
| `sync.ts` | — | — | orchestrator (below). |

## The sync loop (`sync.ts`)

For each **active** connection → each **enabled** source:

1. Refresh the access token if expiring (Google) / re-auth if `reauth_required`.
2. Fetch changes since the stored cursor (`syncToken` / `ctag`+`etag` / HTTP validators).
3. Expand recurrence into the window (skip for Google — already expanded).
4. `upsert` events; delete ones the provider dropped or marked cancelled.
5. Update the cursor, `lastSyncedAt`, and `status`/`lastError`.

An **in-flight guard** skips a source already syncing. A full sync token invalidation (HTTP 410 from Google)
triggers a windowed full re-fetch and a fresh token.

## Window, retention, triggers

- **Window** — a rolling range (default **now −1 week … +6 weeks**, `OPENWEEK_EVENT_WINDOW` tunable) that
  covers week navigation. Recurring masters are expanded only inside it; events outside are pruned.
- **Scheduled** — `server/tasks/calendar-sync.ts` runs every `OPENWEEK_SYNC_INTERVAL` (default **15m**).
- **Manual** — `POST /api/calendars/:id/sync` ("Sync now").
- **On-demand** — opening a week whose source is stale kicks a background sync.

## Secrets & encryption (`server/utils/crypto.ts`)

Credentials are encrypted **at rest** with **AES-256-GCM** (`node:crypto`, no dependency) using
`OPENWEEK_ENCRYPTION_KEY` (base64 of 32 bytes, validated at boot). Each record stores its own **IV + auth tag +
`encKeyVersion`** so keys can be rotated. The encrypted bundle per provider:

- **google** — `{ accessToken, refreshToken, expiry, scope }`
- **caldav** — `{ serverUrl, username, appPassword }`
- **ical** — `{ url }` (uniform shape even when public)

> ⚠️ Losing `OPENWEEK_ENCRYPTION_KEY` makes stored credentials unrecoverable — users must reconnect. Back it
> up. See [self-hosting.md](./self-hosting.md).

## Connect flows

- **Google** — a **dedicated** OAuth flow (scope `calendar.readonly`), separate from Google **sign-in**.
  Redirect → consent → `GET /api/calendars/google/callback` → exchange the code (`google-auth-library`) →
  encrypt tokens → enumerate calendars into `calendar_source` rows. Needs `GOOGLE_CLIENT_ID`/`SECRET`, which
  only the self-hoster can supply: `GET /api/calendars/providers` reports whether they are set, and Settings
  shows the env keys and the redirect URI to register instead of a button that would 400.
- **CalDAV** — server URL + username + **app-specific password**; validated by a probe `fetchCalendars`
  (`tsdav` handles Apple/Nextcloud/Fastmail discovery).
- **iCal** — a feed URL, validated by a probe GET.

## Events in the grid

`GET /api/week` returns imported events for the visible dates alongside tasks. They render as the distinct
**source-colored left-border boxes** (GCal green `#86B08B`, CalDAV blue `#9CBBD6`, iCal tan `#D3B488`) — not
draggable, not checkable. The `showCalendarEvents` setting hides them entirely.

## Convert event → task

`POST /api/events/:id/convert { keepLinked: boolean, date? }` creates a `task` on the event's `localDate`
(or a chosen date), copying the title and time. When `keepLinked` is true it sets `sourceEventId` +
`sourceLabel`, so the task shows a "⤺ from Google Calendar" pill and stays associated with its origin. This is
the one bridge between the read-only mirror and editable tasks. The window reaches a week back, so events on
days that have gone are still shown — but they cannot be converted: a task may not be dated before today
(see [data-model.md](./data-model.md)).

`GET /api/week` marks each event `converted` when a task still links to it, and the **`hideConvertedEvents`**
setting (default on) drops those rows in the client alongside the other visibility rules — so a converted
meeting appears once, as a task. Deleting the task unhides the event; with the setting off the event stays and
shows a quiet "✓ task" instead of its ＋ button.

## Related docs
[data-model.md](./data-model.md) (`calendar_*` tables) · [architecture.md](./architecture.md) ·
[self-hosting.md](./self-hosting.md) (env + key backup)
