# Design

Openweek ships one design in two palettes — **Paper** (light) and **Ink** (dark). They are the same
markup and the same logic; only colour differs. Both are taken verbatim from the approved Claude Design
canvases in `.context/design/` (`Openweek Light.dc.html`, `Openweek Ink.dc.html`).

The look is quiet and structural: a hairline seven-column grid, generous whitespace, one warm accent
against a cool neutral ramp, and no chrome that is not doing work.

> The earlier warm monospace "paper planner" design (IBM Plex Mono, `#F2F1EC`, four highlighter colours,
> a tabbed bottom drawer) is **superseded**. Nothing in it should be used as a reference.

## How the tokens were derived

The two canvases are inline-styled with `oklch()` and carry no token layer. Rather than eyeball values,
the two documents were aligned and colours read off at matching positions — 777 of 797 colours paired
into 101 Paper/Ink pairs, with only two paper values mapping to more than one ink value (genuine role
collisions, which naming resolves). Those pairs became the ~50 semantic `--ow-*` variables in
[`app/assets/css/main.css`](../app/assets/css/main.css).

**Components reference the variables, never raw `oklch()`.** If a value is missing, add it to the token
layer first.

## Colour

The neutral ramp sits on hue `265` and runs quiet → loud *relative to the background*, which is why
lightness reverses between the themes. The accent is persimmon (hue `30–35`).

| Role | Paper | Ink |
|---|---|---|
| `--ow-bg` | `oklch(0.968 0.002 265)` | `oklch(0.135 0.008 265)` |
| `--ow-surface` | `#ffffff` | `oklch(0.215 0.011 265)` |
| `--ow-surface-weekend` | `oklch(0.978 0.003 265)` | `oklch(0.195 0.011 265)` |
| `--ow-sunken` | `oklch(0.963 0.003 265)` | `oklch(0.265 0.013 265)` |
| `--ow-border` | `oklch(0.903 0.004 265)` | `oklch(0.35 0.014 265)` |
| `--ow-hairline` | `oklch(0.928 0.003 265)` | `oklch(0.31 0.013 265)` |
| `--ow-muted` | `oklch(0.6 0.009 265)` | `oklch(0.65 0.012 265)` |
| `--ow-ink` | `oklch(0.24 0.014 265)` | `oklch(0.96 0.008 265)` |
| `--ow-accent` | `oklch(0.55 0.16 30)` | `oklch(0.68 0.15 35)` |
| `--ow-today` | `oklch(0.5 0.09 252)` | `oklch(0.62 0.11 252)` |

Text runs `--ow-ghost` → `--ow-placeholder` → `--ow-done` → `--ow-muted` → `--ow-faint` →
`--ow-secondary` → `--ow-text` → `--ow-strong` → `--ow-title` → `--ow-ink-soft` → `--ow-ink`. Lines and
controls run `--ow-hairline` → `--ow-line` → `--ow-border` → `--ow-border-strong` → `--ow-track` →
`--ow-control` → `--ow-control-strong` → `--ow-mark`. Elevation is `--ow-elev-1` … `--ow-elev-4`.

### The five inks

`persimmon` · `amber` · `jade` · `indigo` · `magenta` — each with a `-tint` and `-edge` variant for the
`fill` highlight mode. Every ink has a **different value in each theme**, so anything persisted stores the
*name* (see [`shared/constants/colors.ts`](../shared/constants/colors.ts)); `inkColor()` resolves it and
passes through pre-rework hex values untouched.

The same five inks serve highlighter tags, list dots, calendar colours and the accent picker.

## Typography

Self-hosted via `@fontsource` — the canvases link Google Fonts, which we deliberately do not copy
(offline, privacy, AGPL). **There is no monospace anywhere.**

- **`--ow-font-display`** — **Bricolage Grotesque** (variable): wordmark, week title, date numerals,
  popover title. Tight tracking (`-0.02em` to `-0.03em`).
- **`--ow-font-body`** — user-selectable: Open Sans (default), Lato, Roboto, Inter, Source Sans 3.

`--ow-text-scale` multiplies the 15px root size for the Small / Default / Large setting.

## Highlight modes (`tagStyle`)

- **`edge`** (default) — the row keeps its surface; a 3px bar in the ink runs down the left.
- **`fill`** — the row takes the ink's `-tint` background and a 1px ring in its `-edge`.

Completed tasks drop the highlight, mute the text and strike it through. Calendar events keep their own
look — a coloured dot and no checkbox — under either mode.

## Screens

Ten frames, mirrored by the components:

- **`TopBar`** — `BrandMark` (five falling bars) · week nav · **Weekends** toggle · range + `W{n}` ·
  progress bar and "X of Y done" · `CalendarsMenu` · `SearchBox` · `AccountMenu`.
- **`WeekGrid`** → **`DayColumn`** — date numeral + weekday, `TODAY` badge, "N left", events then a
  `TASKS` rule, tasks, the done fold, and an inline composer.
- **`TaskItem`** / **`EventItem`** — the row in both the grid and the rail.
- **`TaskDetailPopover`** — title · five inks + none · time · **Move to…** (every day and list) · note ·
  delete. The footer reserves space labelled `SOON: SUBTASKS · REPEAT`.
- **`ListsRail`** → **`ListCard`** — every list visible at once as a card with dot, name, count and a `⋯`
  menu (rename / recolour / delete). Not a drawer, and nothing to switch between.
- **`RolloverReview`** — "N tasks moved to today", each with *send back*, dismissed with **Keep all**.
- **`AuthCard`** — tabbed sign in / create account on a column-ruled frame.
- **`MobileWeek`** — day strip, one day in view, bottom nav.
- **Primitives** — `OwButton`, `OwSwitch`.

## Behaviours the design specifies

- **Focus day** — clicking a day header widens it to `2.1fr` against `0.85fr` for the rest. Nothing hides.
- **Collapse done** — finished tasks fold into a quiet "N done" line per day *and* per list.
- **Weekends** — 7 or 5 columns, from the toolbar or Settings.
- **Cmd/Ctrl-K** — search across this week and every list, capped at 8 results.

## Theme delivery

`app.vue` renders `data-theme`, `data-accent` and the font/scale variables into the initial HTML from the
stored settings, so there is no flash. `system` cannot be resolved server-side, so it ships as Paper plus
a small inline script that flips to Ink before first paint.

## Accessibility

- **Drag-and-drop always has a keyboard path** — "Move to…" in the popover covers every day and every
  list. It is also the screen-reader path, and the primary cross-container action on touch.
- Popovers and menus close on `Esc` and on outside click; the task popover focus-traps and restores focus.
- Colour is never the only signal — inks pair with text, calendars with a name and source badge,
  completion with the `✓` and a strike-through.
- `prefers-reduced-motion` disables the shimmer and transitions.

## Responsive

- **≥1024px** — the seven-column grid with the lists rail beneath.
- **<1024px** — `MobileWeek`: a day strip that pans the week (with an open-task pip per day), one day
  filling the screen, and a bottom nav. The rail stacks underneath, one card per row.

## Related docs

[decisions.md](./decisions.md) · [architecture.md](./architecture.md) · [data-model.md](./data-model.md)
