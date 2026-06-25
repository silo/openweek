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
| [decisions.md](./decisions.md) | Decision log of one-way doors and locked choices, with context. |

## Status

Greenfield. Repo is a bare Nuxt 4.4.8 starter. Planning complete; implementation not started.

## Conventions for these docs

- Keep them in sync with the code as it lands. A doc that lies is worse than no doc.
- Record decisions, not just outcomes — the "why" is the valuable part for future contributors.
- Versions in `tech-stack.md` are pinned majors as of project start (mid-2026); bump deliberately.
