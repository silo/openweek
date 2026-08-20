import type { Task } from '~~/shared/schemas/task'
import type { Container } from '~/composables/useTaskBoard'

/**
 * Completed tasks fold into a quiet "N done" line at the foot of a day or a list.
 *
 * The open/closed state already lives in the week store keyed by container; this derives
 * the rest so day columns and list cards share one definition of the behaviour rather than
 * each re-deriving it.
 */
export function useDoneFold(container: Ref<Container>, tasks: () => Task[]) {
  const week = useWeekStore()
  const settings = useSettingsStore()

  const doneTasks = computed(() => tasks().filter(t => t.completedAt))
  const hasFold = computed(() => (settings.settings?.collapseDone ?? true) && doneTasks.value.length > 0)
  const isOpen = computed(() => week.isFoldOpen(container.value))

  // A task ticked a moment ago stays put until the store lets go of it, so the row folds
  // away *after* its strike-through rather than vanishing under the cursor.
  const visibleTasks = computed(() =>
    hasFold.value && !isOpen.value
      ? tasks().filter(t => !t.completedAt || week.isSettling(t.id))
      : tasks(),
  )
  const label = computed(() =>
    isOpen.value ? `Hide ${doneTasks.value.length} done` : `${doneTasks.value.length} done`,
  )

  return {
    visibleTasks,
    hasFold,
    isOpen,
    label,
    toggle: () => week.toggleFold(container.value),
  }
}
