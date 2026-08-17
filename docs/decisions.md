# Decisions

Why the load-bearing choices were made. Stack-level rejections (vuedraggable, googleapis umbrella, rrule,
Lucia, tRPC, Google Fonts CDN, plain fractional-indexing) live in [tech-stack.md](./tech-stack.md#rejected-and-why);
this file records the **product/architecture** decisions taken during planning.

## D1 — Typography: monospace, per the design (supersedes Inter + Caveat)
The approved **v2 (paper)** design is built on **IBM Plex Mono** (display) + **IBM Plex Sans** (body); the
monospace face is the entire "paper/typewriter" feel. The earlier `tech-stack.md` line (Inter body + Caveat
handwriting accent) predated the final design and is **superseded**. Fonts are self-hosted via `@fontsource`
(no CDN — offline/privacy/AGPL). *Trade-off:* a handwriting accent would have been warmer but diverges from the
signed-off visual; the font **switcher** (editorial/grotesk/typewriter) recovers expressiveness as a per-user
option. See [design.md](./design.md).

## D2 — v1 scope: build the model wide, the UI narrow
The design shows recurring tasks, subtasks, and per-task times, which the README marks "later". Decision: the
**schema supports all of them now** (so there is never a migration to add them), but v1 ships working UI for the
**baseline** (tasks CRUD, highlight colors, notes, per-task **time label**, lists, drag-and-drop, rollover,
read-only sync) plus **convert-event → task** and **basic search**. **Subtasks** and **recurring** are
**schema-ready, UI-deferred**. *Why:* convert-event is core to the calendar value proposition and cheap on top
of sync; recurrence materialization and subtask ordering carry real complexity better done once the core is
solid. See [roadmap.md](./roadmap.md).

## D3 — Full, per-user theme controls
Expose light/dark + accent + font + tag-style (underline vs swipe) + week-start as **per-user settings**. *Why:*
the design already parametrizes all of it and the whole UI reads from CSS variables, so exposing them is nearly
free and differentiates the "make it yours" paper feel. *Trade-off:* a little more settings surface and testing;
trivially reducible to a "light/dark + accent" subset if it proves noisy.

## D4 — Mobile: vertical stack of days
On phones the 7-column grid becomes a **vertical stack** of full-width day sections (list drawer as a bottom
sheet). *Why:* most readable on a narrow screen and keeps drag-and-drop / "Move to…" natural; matches
teuxdeux/tweek mobile precedent. *Rejected:* single-day view (loses week overview) and horizontal column
scroll-snap (awkward cross-column DnD).

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
