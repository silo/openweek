<script setup lang="ts">
import type { CalendarEventDto } from '~~/shared/schemas/calendar'

const props = defineProps<{ event: CalendarEventDto }>()
const emit = defineEmits<{ convert: [] }>()
</script>

<template>
  <div
    class="rounded-r-md py-1.5 pl-2.5 pr-2"
    :style="{ background: `color-mix(in srgb, ${props.event.color} 8%, transparent)`, borderLeft: `2px solid ${props.event.color}` }"
  >
    <div class="flex items-center gap-1.5">
      <span class="min-w-0 flex-1 truncate font-display text-[11.5px] italic text-ow-muted">{{ event.title }}</span>
      <button
        class="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-ow-border px-1.5 py-px font-display text-[8.5px] text-ow-muted hover:text-ow-ink"
        @click="emit('convert')"
      >＋ task</button>
    </div>
    <div class="mt-0.5 flex items-center gap-1.5 font-display text-[9px] text-ow-faint">
      <span v-if="event.timeLabel">◷ {{ event.timeLabel }}</span>
      <span class="inline-flex items-center gap-1">
        <span class="h-1.5 w-1.5 rounded-full" :style="{ background: event.color }" />{{ event.sourceName }}
      </span>
    </div>
  </div>
</template>
