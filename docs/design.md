# Design

The whole appeal of this category is that it feels like a **paper planner**, not a SaaS dashboard. This doc
captures the aesthetic, the theme tokens, typography, accessibility, and the responsive/DnD behaviour that the
components must honour.

## Aesthetic principles

- **Warm off-white / cream** background (aged paper, ~`#FAF7F0`), never pure white.
- **Hairline rules** between days, like ruled notebook paper. Thin borders, **no heavy drop shadows**. Flat
  and calm.
- **Generous whitespace.** Minimal chrome. The week grid should breathe.
- **Highlighter-style task colors** — muted pastel tags (soft yellow, pink, blue, green), like a highlighter
  on paper, not saturated UI chips.
- Dark mode as a second theme with the same restraint.

## How much DaisyUI

DaisyUI is **plumbing, not the chassis**:

- **Use it for:** theme tokens (`base-100/200/300`, `base-content`, accents), the dark-mode mechanism, and
  a11y-sensitive primitives that are tedious to hand-roll — `modal`/`dialog` (task notes, confirm delete),
  `dropdown` (color picker, move menu), `toast` (undo), and form controls (`checkbox`, `input`, `textarea`).
- **Go custom for:** the **week grid**, **DayColumn**, **SomedayList**, and the **draggable bullet row**.
  These are the product and the aesthetic; DaisyUI's `card`/`list` come with shadows/radii/spacing that fight
  the hairline paper look.

To stop DaisyUI primitives from looking "SaaS": set `--depth: 0`, `--noise: 0`, `--border: 1px`, and small
radii in the theme.

## Theme setup (Tailwind v4 + DaisyUI 5, CSS-first)

Single CSS entry, no `tailwind.config.js`:

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@plugin "daisyui";

@plugin "daisyui/theme" {
  name: "paper";
  default: true;
  color-scheme: light;
  --color-base-100: oklch(98% 0.008 85);   /* warm cream ~#FAF7F0 */
  --color-base-200: oklch(96% 0.010 85);   /* faint hover/elevation, no shadow */
  --color-base-300: oklch(93% 0.012 85);
  --color-base-content: oklch(28% 0.02 60); /* warm near-black ink */
  --depth: 0; --noise: 0; --border: 1px;
  --radius-box: 0.25rem; --radius-field: 0.25rem;
}

@plugin "daisyui/theme" {
  name: "paper-dark";
  prefersdark: true;
  color-scheme: dark;
  /* warm charcoal base-*, pastels shifted down in lightness so they read as soft accents */
}

/* App tokens that must survive purge and be usable as utilities */
@theme {
  --color-hairline: oklch(88% 0.01 85);     /* low-contrast warm gray ruled line */
  --color-tag-yellow: oklch(92% 0.09 95);
  --color-tag-pink:   oklch(90% 0.07 5);
  --color-tag-blue:   oklch(90% 0.06 235);
  --color-tag-green:  oklch(91% 0.07 150);
}
```

> Colors above are starting points — tune in OKLCH. Provide a matching ink/`*-content` token per tag for
> text-on-tag contrast. Switch themes via `data-theme` on `<html>` synced to `usePreferredDark` (VueUse) plus
> a manual toggle.

## Typography

- **Body:** Inter (clean humanist sans), self-hosted via `@fontsource/inter`.
- **Accent:** Caveat (handwritten) for the logo and day labels — used **sparingly**, kept tasteful and
  readable; self-hosted via `@fontsource/caveat`.
- Self-hosting (not Google Fonts CDN) keeps the self-hosted box offline-capable and private.

## Accessibility

A planner lives or dies on fast keyboard entry. **Drag is an enhancement, never the only path.**

- **Quick add:** a focus-first input per day/list; Enter creates and keeps focus for rapid entry; a global
  shortcut jumps to "today".
- **Keyboard nav:** arrow/Tab between tasks; Enter to edit, Space to toggle done, a key for the tag picker.
  Day/Someday columns are labelled landmarks.
- **Accessible drag:** we chose `@atlaskit/pragmatic-drag-and-drop` specifically for its keyboard /
  screen-reader model. **Every** drag action also has a non-drag equivalent — a per-task **"move to…" menu**
  (move to day / to Someday / reorder up-down). This is a v1 requirement.
- Respect `prefers-reduced-motion` for drag/rollover animation.

## Responsive / mobile (an architecture decision, not just CSS)

A 7-column grid is unusable on a phone, so **`DayColumn` is the reusable atom**, rendered by two layouts:

- **Desktop (≥ md):** 7-col CSS grid + Someday, hairline rules between columns.
- **Mobile (< md):** **single-day view** with **swipe navigation** (`useSwipe`) between days + a compact week
  strip; **Someday** as its own tab / bottom sheet.

The task row and `DayColumn` must be **layout-agnostic** (no assumption they sit in a grid). On mobile, DnD
maps to long-press or simply the move-menu fallback. Decide this before building the grid to avoid a rewrite.

## Offline / PWA (later, but anticipated now)

weektodo.me is offline-first; users will expect snappy local edits. We **don't** ship `@vite-pwa/nuxt` in v1,
but the data layer is built for it now: all mutations funnel through one optimistic Pinia store over a
normalized cache (see [architecture.md](./architecture.md)), and `fractional-indexing` gives order-merge
tolerance. When PWA lands: precache the static shell, `NetworkFirst` for API, and **exclude Better Auth routes**
from caching to avoid stale-session bugs.
