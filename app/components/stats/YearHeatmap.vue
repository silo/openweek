<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import type { DayCount } from '~~/shared/schemas/stats'
import { heatLevel } from '~~/shared/utils/stats'

const props = defineProps<{
  days: readonly DayCount[]
  weekStartsOn: 0 | 1
}>()

const CELL = 11
const GAP = 3

/**
 * Five steps, each mixed against `--ow-sunken` rather than against white. The neutral ramp
 * reverses lightness between Paper and Ink, so a fixed opacity or a mix against white would
 * come out as a bright smear on the dark theme.
 */
const LEVEL_BG = [
  'var(--ow-hairline)',
  'color-mix(in oklch, var(--ow-accent) 24%, var(--ow-sunken))',
  'color-mix(in oklch, var(--ow-accent) 48%, var(--ow-sunken))',
  'color-mix(in oklch, var(--ow-accent) 72%, var(--ow-sunken))',
  'var(--ow-accent)',
]

const dayOfWeek = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
}

const grid = computed(() => {
  const days = props.days
  if (!days.length) return { cells: [], columns: 0, months: [] as string[] }

  // Pad the first column so every row is one weekday all the way across.
  const lead = (dayOfWeek(days[0]!.date) - props.weekStartsOn + 7) % 7
  const max = Math.max(...days.map(d => d.n))
  const cells: ({ date: string, n: number, level: number } | null)[] = Array.from({ length: lead }, () => null)
  for (const d of days) cells.push({ date: d.date, n: d.n, level: heatLevel(d.n, max) })

  const columns = Math.ceil(cells.length / 7)
  const months: string[] = []
  let last = ''
  for (let c = 0; c < columns; c++) {
    const first = cells.slice(c * 7, c * 7 + 7).find(Boolean)
    const label = first ? format(parseISO(first.date), 'MMM') : ''
    // Only when the month turns, and never in the last two columns where it would run off.
    if (label && label !== last && c < columns - 2) {
      months.push(label)
      last = label
    }
    else { months.push('') }
  }

  return { cells, columns, months }
})

const active = computed(() => props.days.filter(d => d.n > 0).length)
const busiest = computed(() => props.days.reduce((a, b) => (b.n > a.n ? b : a), { date: '', n: 0 }))

/**
 * The grid is one image to assistive tech. Labelling 365 cells individually would read the
 * whole year aloud a day at a time; the figures that matter are in the tiles above it, so
 * this summarises and the cells themselves stay hidden with a hover title for the mouse.
 */
const summary = computed(() => {
  if (!busiest.value.n) return 'Completion heatmap: nothing finished in the last year'
  return `Completion heatmap: ${active.value} active days in the last year, `
    + `busiest ${busiest.value.n} on ${format(parseISO(busiest.value.date), 'd MMMM')}`
})
</script>

<template>
  <div class="overflow-x-auto pb-1">
    <div class="min-w-max">
      <div
        class="mb-1.5 grid text-[10.5px] leading-none text-ow-faint"
        :style="{ gridTemplateColumns: `repeat(${grid.columns}, ${CELL}px)`, gap: `${GAP}px` }"
        aria-hidden="true"
      >
        <span v-for="(m, i) in grid.months" :key="i" class="overflow-visible whitespace-nowrap">{{ m }}</span>
      </div>

      <div
        class="grid grid-flow-col"
        role="img"
        :aria-label="summary"
        :style="{
          gridTemplateColumns: `repeat(${grid.columns}, ${CELL}px)`,
          gridTemplateRows: `repeat(7, ${CELL}px)`,
          gap: `${GAP}px`,
        }"
      >
        <div
          v-for="(cell, i) in grid.cells"
          :key="i"
          class="rounded-[2px]"
          :style="{ background: cell ? LEVEL_BG[cell.level] : 'transparent' }"
          :title="cell ? `${cell.n} on ${format(parseISO(cell.date), 'EEE d MMM yyyy')}` : undefined"
        />
      </div>

      <div class="mt-2.5 flex items-center justify-end gap-1.5 text-[11.5px] text-ow-faint" aria-hidden="true">
        <span>Less</span>
        <span
          v-for="(bg, i) in LEVEL_BG"
          :key="i"
          class="rounded-[2px]"
          :style="{ background: bg, width: `${CELL}px`, height: `${CELL}px` }"
        />
        <span>More</span>
      </div>
    </div>
  </div>
</template>
