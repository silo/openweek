import type { TaskColor } from '#shared/types/task'
import { TASK_COLORS } from '#shared/types/task'

// Highlighter tags → utility classes. Tokens live in app/assets/css/main.css (@theme).
const SWATCH: Record<TaskColor, string> = {
  yellow: 'bg-tag-yellow',
  pink: 'bg-tag-pink',
  blue: 'bg-tag-blue',
  green: 'bg-tag-green',
}

// Soft background highlight (legacy; TaskRow moves to underline/swipe in 6d).
const HIGHLIGHT: Record<TaskColor, string> = {
  yellow: 'bg-tag-yellow/50',
  pink: 'bg-tag-pink/50',
  blue: 'bg-tag-blue/50',
  green: 'bg-tag-green/50',
}

// CSS var per tag — used by the .tag-underline / .tag-swipe highlighter styles.
const TAG_VAR: Record<TaskColor, string> = {
  yellow: 'var(--color-tag-yellow)',
  pink: 'var(--color-tag-pink)',
  blue: 'var(--color-tag-blue)',
  green: 'var(--color-tag-green)',
}

// The 4 accent options (solid swatch colors), applied to --color-accent at runtime.
export const ACCENT_HEX = {
  butter: '#EAD9A0',
  mint: '#CFE0CB',
  sky: '#CBDDE9',
  rose: '#E7CDD4',
} as const

export type AccentName = keyof typeof ACCENT_HEX
export type TagStyle = 'underline' | 'swipe'

export function useTaskColors() {
  return {
    colors: TASK_COLORS,
    swatchClass: (c: TaskColor) => SWATCH[c],
    highlightClass: (c: TaskColor | null) => (c ? HIGHLIGHT[c] : ''),
    tagVar: (c: TaskColor) => TAG_VAR[c],
    /** Class for the active highlighter style ('underline' | 'swipe'). */
    tagStyleClass: (style: TagStyle) => (style === 'swipe' ? 'tag-swipe' : 'tag-underline'),
  }
}
