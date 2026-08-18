<script setup lang="ts">
import type { CalendarEventDto } from '~~/shared/schemas/calendar'
import { inkColor } from '~~/shared/constants/colors'

defineProps<{ event: CalendarEventDto }>()
const emit = defineEmits<{ convert: [CalendarEventDto] }>()

const PROVIDER_LABEL = { google: 'Google', caldav: 'CalDAV', ical: 'iCal' } as const
</script>

<template>
  <div class="mb-0.5 flex items-start gap-2 py-[3px] pl-0.5 pr-1">
    <!-- a dot, not a checkbox: calendar events are read-only and cannot be completed -->
    <span
      class="mt-1.5 h-[7px] w-[7px] flex-none rounded-full"
      :style="{ background: inkColor(event.color) }"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline gap-1.5">
        <span v-if="event.timeLabel" class="text-[11.5px] tabular-nums text-ow-faint">{{ event.timeLabel }}</span>
        <span class="min-w-0 flex-1 text-[13.5px] text-ow-strong">{{ event.title }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="truncate whitespace-nowrap text-[11.5px] text-ow-done">
          {{ event.sourceName }} · {{ PROVIDER_LABEL[event.provider] }}
        </span>
        <div class="flex-1" />
        <!-- The visible label is just "＋ task"; name the event for screen readers. -->
        <button
          type="button"
          title="Make this a task"
          :aria-label="`Make ${event.title} a task`"
          class="cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-[11.5px] text-ow-muted transition-colors hover:text-ow-strong"
          @click="emit('convert', event)"
        >
          ＋ task
        </button>
      </div>
    </div>
  </div>
</template>
