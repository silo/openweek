<script setup lang="ts">
import type { WeekDay } from '~/composables/useWeek'
import { useBoardStore } from '~/stores/board'

/**
 * One day column — the reusable atom for the desktop 7-col grid and the mobile
 * single-day view. Renders top-level tasks for its date (subtasks live under
 * their parent) and a focus-first quick-add. Lists live in the bottom drawer.
 */
const props = defineProps<{ day: WeekDay }>()

const store = useBoardStore()
const user = useAuthUser()
const search = useState('week-search', () => '')
const scope = computed(() => ({ date: props.day.iso }))
const tasks = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.tasksForDate(props.day.iso)
    .filter(t => !t.parentId)
    .filter(t => !q || t.title.toLowerCase().includes(q))
})
const events = computed(() => (user.value?.showCalendarEvents === false ? [] : store.eventsForDate(props.day.iso)))

const dropEl = ref<HTMLElement>()
useDropColumn(dropEl, () => scope.value)
</script>

<template>
  <section
    class="flex min-h-48 flex-col"
    :class="day.isToday ? 'bg-accent/10' : ''"
    :aria-label="day.dayName"
  >
    <header class="flex items-center gap-2 px-4 pb-2 pt-3">
      <span
        v-if="day.isToday"
        class="grid size-[26px] place-items-center rounded-full bg-accent font-mono text-[15px] leading-none text-base-content"
      >{{ day.dayNumber }}</span>
      <span v-else class="font-mono text-[17px] leading-none">{{ day.dayNumber }}</span>
      <span class="font-mono text-[10px] tracking-widest text-base-content/40">{{ day.dayName.toUpperCase() }}</span>
    </header>

    <div ref="dropEl" class="flex flex-1 flex-col gap-3 px-3.5 pb-4 pt-1">
      <TaskRow v-for="task in tasks" :key="task.id" :task="task" />
      <EventRow v-for="ev in events" :key="ev.id" :event="ev" />
      <QuickAdd :scope="scope" />
    </div>
  </section>
</template>
