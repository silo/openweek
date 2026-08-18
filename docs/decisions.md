# Decisions

Why the load-bearing choices were made. Stack-level rejections (vuedraggable, googleapis umbrella, rrule,
Lucia, tRPC, Google Fonts CDN, plain fractional-indexing) live in [tech-stack.md](./tech-stack.md#rejected-and-why);
this file records the **product/architecture** decisions taken during planning.

## D1 — Typography: Bricolage Grotesque display + a selectable body face
*Supersedes the earlier monospace decision.* The reworked **Paper/Ink** design drops monospace entirely:
**Bricolage Grotesque** carries the display voice (wordmark, week title, date numerals) with tight tracking,
and the body face is a **per-user choice** of Open Sans (default), Lato, Roboto, Inter or Source Sans 3.
*Why:* the "typewriter" feel went with the old warm paper palette; the new design is quieter and more
structural, and a grotesque display against a neutral body reads better at the grid's density. Fonts stay
self-hosted via `@fontsource` — the canvases link Google Fonts, which we do not copy (offline/privacy/AGPL).
See [design.md](./design.md).

## D2 — v1 scope: build the model wide, the UI narrow
The design shows recurring tasks, subtasks, and per-task times, which the README marks "later". Decision: the
**schema supports all of them now** (so there is never a migration to add them), but v1 ships working UI for the
**baseline** (tasks CRUD, highlight colors, notes, per-task **time label**, lists, drag-and-drop, rollover,
read-only sync) plus **convert-event → task** and **basic search**. **Subtasks** and **recurring** are
**schema-ready, UI-deferred**. *Why:* convert-event is core to the calendar value proposition and cheap on top
of sync; recurrence materialization and subtask ordering carry real complexity better done once the core is
solid. See [roadmap.md](./roadmap.md).

## D3 — Full, per-user appearance controls
Expose theme (Paper/Ink/System), accent, typeface, highlight style (`edge` vs `fill`), text size, week start,
weekends, and collapse-done as **per-user settings**. *Why:* the design ships a full Settings → Appearance
panel and the whole UI reads from CSS variables, so exposing them is nearly free. *Trade-off:* more settings
surface, and it cost a migration — four enums changed their values and three columns were added
(see `0001`). Trivially reducible to a theme-and-accent subset if it proves noisy.

## D3a — Colours are stored by name, not by value
Every ink has a different value in Paper and Ink, so a persisted hex renders wrong in one of them. Settings,
lists and calendar sources therefore store an ink **name** (`jade`), resolved to a CSS variable at render.
*Why:* one stored value stays correct under a theme switch, and the palette can be retuned without a data
migration. Rows written before the rework hold a literal colour and pass through untouched.

## D4 — Mobile: a day strip with one day in view
*Supersedes the vertical-stack decision.* Below the grid's breakpoint the week becomes a **day strip** that
pans the week — each day showing its date and a pip when it has open tasks — with the selected day filling
the screen, and a bottom nav. *Why:* the reworked design specifies it, and it keeps a full week's shape
visible in the strip while giving one day enough room for real task rows. "Move to…" remains the primary
cross-day action on touch. *Rejected:* the earlier vertical stack (a lot of scrolling, and the week's shape
is lost as soon as any day has more than a few tasks).

## D5 — Read-only sync via polling, events cached in Postgres
Calendar sync is one-way (mirror-in) and driven by a **Nitro scheduled poll**, not Google push/watch (which
needs a public HTTPS callback most self-hosters lack). Fetched events are **cached** in `calendar_event` so the
week view is fast and resilient to provider hiccups. `ical.js` (not `rrule`) expands recurrence so
VTIMEZONE/EXDATE/RECURRENCE-ID are correct. See [calendar-sync.md](./calendar-sync.md).

## D6 — Optimistic single store, no realtime in v1
The week grid is one **optimistic-mutation** Pinia store (instant feel, rollback on error). Multi-device
convergence rests on **uuidv7 + jittered fractional indices** (concurrent inserts never collide) plus
refetch-on-focus; a websocket/live layer is deferred and additive. *Why:* realtime infrastructure is
disproportionate for a personal weekly planner.

## D7 — Bucket invariant: a task is on a day XOR in a list
`task` carries either `date` or `listId`, enforced by `CHECK (num_nonnulls(date, list_id) = 1)`. *Why:* it makes
"Someday/Work/…" lists and day columns the same primitive (a bucket + fractional order), so drag-and-drop, move,
and rollover share one code path. See [data-model.md](./data-model.md).

## D8 — Month view out of scope for v1
The v2 target layout has no month affordance and the README is week-first; a month view is a later phase.

## Related docs
[tech-stack.md](./tech-stack.md) · [architecture.md](./architecture.md) · [roadmap.md](./roadmap.md)
