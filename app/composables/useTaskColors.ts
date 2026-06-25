import type { TaskColor } from '#shared/types/task'
import { TASK_COLORS } from '#shared/types/task'

// Highlighter tags → utility classes. Tokens live in app/assets/css/main.css (@theme).
const SWATCH: Record<TaskColor, string> = {
  yellow: 'bg-tag-yellow',
  pink: 'bg-tag-pink',
  blue: 'bg-tag-blue',
  green: 'bg-tag-green',
}

const HIGHLIGHT: Record<TaskColor, string> = {
  yellow: 'bg-tag-yellow/50',
  pink: 'bg-tag-pink/50',
  blue: 'bg-tag-blue/50',
  green: 'bg-tag-green/50',
}

export function useTaskColors() {
  return {
    colors: TASK_COLORS,
    swatchClass: (c: TaskColor) => SWATCH[c],
    highlightClass: (c: TaskColor | null) => (c ? HIGHLIGHT[c] : ''),
  }
}
