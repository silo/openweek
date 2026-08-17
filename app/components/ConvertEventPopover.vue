<script setup lang="ts">
import type { CalendarEventDto } from '~~/shared/schemas/calendar'

const props = defineProps<{ event: CalendarEventDto }>()
const emit = defineEmits<{ close: [] }>()
const week = useWeekStore()
const keepLinked = ref(true)
const busy = ref(false)

async function make() {
  busy.value = true
  try {
    await week.convertEvent(props.event.id, keepLinked.value, props.event.localDate)
    emit('close')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-32" @click.self="emit('close')">
    <div class="w-[280px] overflow-hidden rounded-xl border border-ow-border bg-ow-surface shadow-2xl">
      <div class="border-b border-ow-hairline px-4 py-3">
        <div class="mb-2 font-display text-[9px] uppercase tracking-widest text-ow-faint">Convert event to task</div>
        <div class="flex items-start gap-2">
          <span class="mt-0.5 h-[15px] w-[15px] shrink-0 rounded-full border-[1.5px] border-ow-border" />
          <span class="font-display text-[13px] leading-snug">{{ event.title }}</span>
        </div>
        <div class="ml-6 mt-1.5 flex items-center gap-1.5 font-display text-[9.5px] text-ow-faint">
          <span v-if="event.timeLabel">◷ {{ event.timeLabel }}</span>
          <span class="inline-flex items-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full" :style="{ background: event.color }" />{{ event.sourceName }}
          </span>
        </div>
      </div>
      <label class="flex cursor-pointer items-center gap-2 px-4 py-3 text-[11.5px] text-ow-ink">
        <input v-model="keepLinked" type="checkbox" class="checkbox checkbox-sm">
        Keep linked to calendar event
      </label>
      <div class="flex gap-2 px-4 pb-3.5">
        <button
          class="flex-1 rounded-lg py-2 font-display text-[11.5px] font-medium disabled:opacity-60"
          style="background: var(--ow-accent); color: var(--ow-accent-ink);"
          :disabled="busy"
          @click="make"
        >＋ Make task</button>
        <button class="rounded-lg border border-ow-border px-3.5 py-2 font-display text-[11.5px] text-ow-muted" @click="emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>
