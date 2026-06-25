# Openweek Documentation

Planning and design docs for **Openweek** — a free, open-source, self-hostable minimalist weekly planner.
The core UX is a **paper-planner week grid**: 7 day columns + "Someday" lists, with draggable, checkable,
color-tagged bullet tasks. No hourly scheduling.

These docs are the source of truth for *why* the project is built the way it is. The repo root
[`CLAUDE.md`](../CLAUDE.md) is the quick reference; the files here are the depth.

## Index

| Doc | What's in it |
|---|---|
| [tech-stack.md](./tech-stack.md) | Final dependency list with versions, rationale, and what we rejected and why. |
| [architecture.md](./architecture.md) | Folder structure, layers, data flow, shared-schema rules, state/mutation model. |
| [data-model.md](./data-model.md) | Drizzle schema, constraints, ordering, rollover, recurrence forward-compat. |
| [calendar-sync.md](./calendar-sync.md) | Connected accounts (Google/CalDAV/iCal), token encryption, polling, recurrence expansion. |
| [design.md](./design.md) | Paper aesthetic, theme tokens, fonts, accessibility, responsive/mobile, DnD UX. |
| [self-hosting.md](./self-hosting.md) | Env vars, secrets, Docker, migrations, backups, reverse proxy. |
| [roadmap.md](./roadmap.md) | Phased build plan, scope (now vs later), per-phase verification. |
| [testing.md](./testing.md) | Test strategy, environments, coverage map, and what's verified another way. |
| [decisions.md](./decisions.md) | Decision log of one-way doors and locked choices, with context. |

## Status

Phases 1–4 implemented: setup/self-host ops, auth, the week grid + task CRUD + the optimistic
store, and drag & drop (with the move-menu fallback). Vitest suite in place. Next: Phase 5
(calendar-sync foundation).

## Conventions for these docs

- Keep them in sync with the code as it lands. A doc that lies is worse than no doc.
- Record decisions, not just outcomes — the "why" is the valuable part for future contributors.
- Versions in `tech-stack.md` are pinned majors as of project start (mid-2026); bump deliberately.
