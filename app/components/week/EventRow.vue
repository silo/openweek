<script setup lang="ts">
import type { SyncedEventOccurrence } from '#shared/types/task'
import { useBoardStore } from '~/stores/board'

// A read-only mirrored calendar event with a source-colored left border and a
// convert-to-task popover. Source colors per docs/calendar-sync.md.
const props = defineProps<{ event: SyncedEventOccurrence }>()
const store = useBoardStore()

const SRC: Record<string, string> = { google: '#86B08B', caldav: '#9CBBD6', ical: '#D3B488' }
const color = computed(() => SRC[props.event.provider] ?? '#9CBBD6')
const keepLinked = ref(true)

function convert() {
  store.convertEvent(props.event, keepLinked.value)
}
</script>

<template>
  <div class="rounded-r px-2 py-1" :style="{ borderLeft: `2px solid ${color}`, background: `${color}14` }">
    <div class="flex items-center gap-1.5">
      <span class="min-w-0 flex-1 truncate font-mono text-[11.5px] italic text-base-content/65">{{ event.title }}</span>
      <div class="dropdown dropdown-end shrink-0">
        <div tabindex="0" role="button" class="rounded-full border border-hairline bg-base-100 px-1.5 font-mono text-[8.5px] text-base-content/50 hover:text-base-content">＋ task</div>
        <div tabindex="0" class="dropdown-content z-30 w-60 rounded-box border border-hairline bg-base-100 p-3 shadow">
          <div class="mb-2 font-mono text-[9px] uppercase tracking-widest opacity-50">Convert event to task</div>
          <div class="font-mono text-[13px]">{{ event.title }}</div>
          <div class="mt-1 font-mono text-[9.5px] text-base-content/50">
            <span v-if="event.startTime">◷ {{ event.startTime }} · </span>{{ event.calendarName }}
          </div>
          <label class="mt-3 flex items-center gap-2 text-xs">
            <input v-model="keepLinked" type="checkbox" class="checkbox checkbox-xs">
            Keep linked to calendar event
          </label>
          <button class="btn btn-primary btn-xs mt-3 w-full" @click="convert">＋ Make task</button>
        </div>
      </div>
    </div>
    <div class="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] text-base-content/45">
      <span v-if="event.startTime">◷ {{ event.startTime }}</span>
      <span class="inline-flex items-center gap-1">
        <span class="size-1.5 rounded-full" :style="{ background: color }" />
        {{ event.calendarName }}
      </span>
    </div>
  </div>
</template>
