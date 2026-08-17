# Design

The "paper planner" aesthetic — warm, calm, monospace, hairline rules, generous whitespace. Tokens are taken
verbatim from the approved Claude Design **v2 (paper)** file; the task-detail popover comes from the sidebar
variants. Everything renders through CSS variables so the per-user theme (accent, font, tag-style, light/dark)
is a variable swap, mirroring the design's own mechanism.

## Typography

Self-hosted via `@fontsource` (no CDN — offline + privacy + AGPL ethos):

- **`--ow-display`** — **IBM Plex Mono** — logo, week title, dates, day labels, task text, and UI chrome.
- **`--ow-body`** — **IBM Plex Sans** — notes and longer-form body text.

The monospace display face *is* the paper look. The `fontStyle` setting swaps `--ow-display`/`--ow-body`:

| `fontStyle` | display | body |
|---|---|---|
| `plex-mono` (default) | IBM Plex Mono | IBM Plex Sans |
| `editorial` | Newsreader | IBM Plex Sans |
| `grotesk` | Space Grotesk | Space Grotesk |
| `typewriter` | Spline Sans Mono | IBM Plex Sans |

## Color tokens

### Light (canonical, from v2)
| Token | Value | Use |
|---|---|---|
| `--ow-bg` | `#F2F1EC` | app background (paper) |
| `--ow-surface` | `#FFFFFF` | cards, grid |
| `--ow-sunken` | `#FCFBF7` | bottom drawer |
| `--ow-ink` | `#2A2A28` | primary text |
| `--ow-muted` | `#8C887D` | secondary text |
| `--ow-faint` | `#AEA99D` | labels, meta |
| `--ow-ghost` | `#C8C4BA` | placeholders, chevrons |
| `--ow-hairline` | `#EDEBE4` | column/row rules |
| `--ow-border` | `#E7E4DB` | inputs, pills |
| `--ow-selection` | `#EAD9A0` | text selection |

### Dark (warm paper, derived — design ships light only, but the sidebar shows a Light/Dark toggle)
`--ow-bg` `#1B1A17` · `--ow-surface` `#221F1B` · `--ow-sunken` `#1E1B18` · `--ow-ink` `#E8E4DA` · `--ow-muted`
`#9A968B` · `--ow-hairline` `#33302A` · `--ow-border` `#3B372F`. Accents keep hue, lighten slightly;
highlighter colors are dimmed ~25%.

### Accent (`--ow-accent`, user-settable)
Default **sky `#CBDDE9`**; options butter `#EAD9A0`, mint `#CFE0CB`, rose `#E7CDD4`. Drives: the brand square,
Today column tint (`rgba(accent, .10)`) + filled date circle (accent bg, text `#5C5226`), the active list-tab
underline, the "write a task" caret, and primary buttons.

### Highlighter palette (the color-tag)
butter `#EAD9A0` · mint `#D2E2CD` · sky `#CFDEEA` · rose `#E9D2D8`.

### Calendar source colors
GCal `#86B08B` · CalDAV `#9CBBD6` · iCal `#D3B488`.

### Elevation
Popover shadow: `0 16px 44px -12px rgba(60,52,30,.28), 0 3px 10px rgba(60,52,30,.10)`.

## Highlighter rendering (`tagStyle`)

Two modes, ported exactly from the design's `hl()`:

- **`underline`** (default) — a highlighter swipe *under* the text:
  `background-image: linear-gradient(to top, <c> 0%, <c> 42%, transparent 42%)`.
- **`swipe`** — a solid marker block: `background:<c>; padding:1px 4px; border-radius:3px;
  box-decoration-break: clone` (wraps cleanly across lines).

Completed tasks add `line-through` and mute the text (`#9A968C`).

## Components (map 1:1 to the design)

- **`TopBar`** — brand (accent square + `openweek` in mono) · `WeekNav` (`‹ June 22–28 ›` + Today pill + WEEK n)
  · `CalendarsMenu` (source dots + "N calendars") · progress ("X of Y done") · search · avatar.
- **`WeekGrid`** → **`DayColumn`** — date + weekday abbr; **today** = accent tint + filled circle; the
  "Write a task" inline composer with a blinking caret (today only).
- **`TaskItem`** — mark `○`/`✓`, highlighted title, meta row (`◷` time · `↻` repeat · `☑` sub x/y), the
  "⤺ from …" provenance pill, italic note, rolled `↪` indicator.
- **`EventItem`** — source-colored left-border box, time, source label, `＋ task` convert affordance.
- **`TaskDetailPopover`** — circle checkbox + title + list chip · color-picker row (butter/mint/sky/rose + none)
  · time · recurrence · **subtasks** list · note · footer (↪ Move to… · ⧉ Duplicate · 🗑 Delete).
- **`ConvertEventPopover`** — "CONVERT EVENT TO TASK", event details, "Keep linked to calendar event"
  checkbox, Make task / Cancel.
- **`ListDrawer`** — active list items (2-row horizontal grid) + tab bar (colored dot + name + count, active =
  accent underline) + "＋ New list".
- **Primitives** — `OwButton`, `OwPill`, `TaskMark`, `ColorSwatch`.

Implementation note: the design's inline styles collapse into Tailwind v4 utilities + the token variables
above; a DaisyUI theme provides the light/dark switch. Prefer semantic component classes over re-deriving hex
values.

## Accessibility

- **Drag-and-drop always has a keyboard path** — every reorder/move is also reachable via the "Move to…" menu
  (also the screen-reader path). See [architecture.md](./architecture.md) and Phase 5 in [roadmap.md](./roadmap.md).
- Popovers focus-trap and restore focus on close; `Esc` closes.
- Checkboxes/lists carry proper ARIA roles and state; the completion `✓`/`○` is a real toggle.
- **Color is never the only signal** — highlight tags pair with text, sources pair with labels, completion
  pairs with the mark + strike-through.
- `prefers-reduced-motion` disables the caret blink and DnD animations.
- Tokens are contrast-checked (WCAG AA for text).

## Responsive

- **≥1024px** — the 7-column grid + bottom list drawer, as designed.
- **640–1024px** — reduced column padding; drawer collapses to a launcher.
- **<640px** — **vertical stack**: each day is a full-width section stacked top-to-bottom with a sticky
  header; the list drawer becomes a bottom sheet; the top bar compacts. DnD reorders vertically and moves
  across day sections; the "Move to…" menu is the primary cross-day action on touch.

## States

Skeleton loaders (the design's placeholder hints map to these), paper-voice empty states (empty week / empty
list), calendar-connection error banners, and a subtle "synced Nm ago / syncing…" indicator on `CalendarsMenu`.

## Related docs
[decisions.md](./decisions.md) (why monospace, why full theme controls) · [architecture.md](./architecture.md)
· [roadmap.md](./roadmap.md)
