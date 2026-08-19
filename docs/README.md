# Openweek documentation

The project overview, feature list and **self-hosting guides** (Docker Compose, Portainer, Proxmox) live in the
[root README](../README.md). These pages are the detail behind it.

## Start here

| Doc | What's in it |
|---|---|
| [tech-stack.md](./tech-stack.md) | Every dependency, its version, and what was rejected and why. |
| [architecture.md](./architecture.md) | The three-root layout, layers, data flow, and state model. |
| [data-model.md](./data-model.md) | Tables, enums, constraints, ordering, and the ink palette. |

## Building on it

| Doc | What's in it |
|---|---|
| [design.md](./design.md) | Paper/Ink, the `--ow-*` token layer, typography, accessibility, responsive layout. |
| [calendar-sync.md](./calendar-sync.md) | Google / CalDAV / iCal connections, the sync loop, credential encryption. |
| [testing.md](./testing.md) | Test strategy, the Vitest/Playwright split, and the seeded fixtures. |

## Running it

| Doc | What's in it |
|---|---|
| [self-hosting.md](./self-hosting.md) | Operations: every env var, the container, reverse proxy, backups, upgrades. |

## Deciding it

| Doc | What's in it |
|---|---|
| [roadmap.md](./roadmap.md) | Build phases, what's shipped, what's deferred, what's out of scope. |
| [decisions.md](./decisions.md) | The whys behind the choices the other docs only state. |

---

Working in this repo? [`CLAUDE.md`](../CLAUDE.md) at the root is the short version — commands, conventions, and
the rules that override defaults. Keep it and these pages in sync as the stack evolves.
