<script setup lang="ts">
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import type { Task } from '~~/shared/schemas/task'

const props = defineProps<{
  date: string
  tasks: Task[]
  events: CalendarEventDto[]
  isToday: boolean
  weekday: string
  dayNum: string
}>()
const emit = defineEmits<{ openTask: [task: Task], convert: [event: CalendarEventDto] }>()

const bodyEl = ref<HTMLElement>()
onMounted(() => {
  const el = bodyEl.value
  if (!el) return
  const stop = columnDropTarget(el, props.date)
  onUnmounted(stop)
})
</script>

<template>
  <section
    class="flex min-w-0 flex-col border-b border-ow-hairline last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
    :style="isToday ? { background: 'color-mix(in srgb, var(--ow-accent) 10%, transparent)' } : undefined"
  >
    <div class="flex items-center gap-2 px-4 pb-2.5 pt-3">
      <span
        v-if="isToday"
        class="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[15px]"
        style="background: var(--ow-accent); color: var(--ow-accent-ink);"
      >{{ dayNum }}</span>
      <span v-else class="font-display text-[17px] text-ow-ink">{{ dayNum }}</span>
      <span class="font-display text-[10px] uppercase tracking-widest text-ow-faint">{{ weekday }}</span>
    </div>

    <div ref="bodyEl" class="flex flex-1 flex-col gap-3 px-3.5 pb-4 pt-1.5">
      <TaskItem v-for="t in tasks" :key="t.id" :task="t" @open="emit('openTask', t)" />
      <EventItem v-for="e in events" :key="e.id" :event="e" @convert="emit('convert', e)" />
      <TaskComposer :date="date" />
    </div>
  </section>
</template>
