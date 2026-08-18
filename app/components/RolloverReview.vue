<script setup lang="ts">
import { format, parseISO } from 'date-fns'

const week = useWeekStore()
const settings = useSettingsStore()

/**
 * Only offered on the current week, and only until dismissed — rollover already moved the
 * tasks, this is the chance to undo it before the day gets going.
 */
const show = computed(() =>
  (settings.settings?.rolloverEnabled ?? false)
  && !week.rolloverReviewed
  && week.rolledIn.length > 0,
)

const title = computed(() => {
  const n = week.rolledIn.length
  return `${n} ${n === 1 ? 'task' : 'tasks'} moved to today`
})

function fromLabel(originalDate: string) {
  return format(parseISO(originalDate), 'EEE d MMM')
}
</script>

<template>
  <div
    v-if="show"
    class="flex flex-wrap items-center gap-3 border-b border-ow-line px-[18px] py-[11px]"
    style="background: var(--ow-select-bg);"
  >
    <span class="text-[13px]" style="color: var(--ow-today);" aria-hidden="true">↻</span>
    <span class="text-[13.5px] font-semibold text-ow-ink-soft">{{ title }}</span>

    <div class="flex min-w-0 flex-1 flex-wrap gap-[7px]">
      <span
        v-for="t in week.rolledIn"
        :key="t.id"
        class="flex items-center gap-[7px] rounded-full border border-ow-border bg-ow-surface py-[3px] pl-[11px] pr-[5px] text-[13px] text-ow-title"
      >
        <span>{{ t.title }}</span>
        <button
          type="button"
          :title="`Send back to ${fromLabel(t.originalDate!)}`"
          :aria-label="`Send ${t.title} back to ${fromLabel(t.originalDate!)}`"
          class="h-5 w-5 cursor-pointer rounded-full border-none bg-ow-sunken p-0 text-xs leading-none text-ow-secondary transition-colors hover:bg-ow-inset hover:text-ow-ink"
          @click="week.sendBack(t.id)"
        >
          ↩
        </button>
      </span>
    </div>

    <OwButton size="sm" @click="week.rolloverReviewed = true">
      Keep all
    </OwButton>
  </div>
</template>
