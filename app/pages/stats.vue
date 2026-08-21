<script setup lang="ts">
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { StatsRange } from '~~/shared/schemas/stats'
import { inkColor } from '~~/shared/constants/colors'
import { pct } from '~~/shared/utils/stats'

const stats = useStatsStore()
const settings = useSettingsStore()

await useAsyncData('stats', async () => {
  if (!stats.payload) await stats.load()
  return stats.range
})

const s = computed(() => stats.payload)
const weekStartsOn = computed(() => (settings.settings?.weekStartsOn ?? 1) as 0 | 1)

const RANGES = [
  { v: '4w', label: '4 weeks' },
  { v: '12w', label: '12 weeks' },
  { v: 'year', label: 'Year' },
] as const

/** ISO weekday (1–7) to a short name, so the rotated row can label itself. */
const WEEKDAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const followThrough = computed(() => pct(s.value?.closedOfPlanned ?? 0, s.value?.planned ?? 0))

const splitParts = computed(() => [
  { key: 'early', label: 'ahead of the day', value: s.value?.early ?? 0, color: inkColor('jade') },
  { key: 'on', label: 'on the day', value: s.value?.onTheDay ?? 0, color: 'var(--ow-accent)' },
  { key: 'late', label: 'after the day', value: s.value?.late ?? 0, color: inkColor('amber') },
])

const weekdayBars = computed(() =>
  (s.value?.weekdays ?? []).map(d => ({
    key: String(d.weekday),
    label: WEEKDAY_LABELS[d.weekday]!,
    value: d.n,
  })),
)

const hourBars = computed(() =>
  (s.value?.hours ?? []).map(h => ({ key: String(h.hour), label: String(h.hour).padStart(2, '0'), value: h.n })),
)

const trendBars = computed(() =>
  (s.value?.trend ?? []).map(t => ({
    key: t.start,
    label: format(parseISO(t.start), 'd MMM'),
    value: t.closed,
    of: t.total,
  })),
)

/** Enough labels to orient by, without turning the axis into an unreadable ruler. */
const trendLabelEvery = computed(() => (trendBars.value.length > 20 ? 7 : 1))

const trendHeading = computed(() => {
  const n = s.value?.trend.length ?? 0
  return `THE LAST ${n} ${s.value?.trendUnit === 'day' ? 'DAYS' : 'WEEKS'}`
})

/** Nothing planned and nothing ticked — the page has no story to tell yet. */
const empty = computed(() => !!s.value && s.value.planned === 0 && s.value.closed === 0)

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const days = (n: number | null) => (n === null ? '—' : plural(Math.round(n * 10) / 10, 'day'))

const heading = 'mb-3 text-[11px] font-semibold tracking-[0.06em] text-ow-faint'
const note = 'mt-3 max-w-[560px] text-[13px] leading-relaxed text-ow-muted'
const tiles = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
const card = 'rounded-xl border border-ow-border bg-ow-surface px-4 py-4'
</script>

<template>
  <div class="min-h-screen bg-ow-surface">
    <main class="min-h-screen">
      <header class="flex flex-wrap items-center gap-4 border-b border-ow-line px-5 py-3.5">
        <NuxtLink
          to="/"
          class="rounded-[9px] border border-ow-border px-3 py-1.5 text-[13.5px] text-ow-text no-underline transition-colors hover:bg-ow-sunken hover:text-ow-ink"
        >
          ‹ Week
        </NuxtLink>
        <h1 class="font-display text-lg font-semibold tracking-[-0.02em] text-ow-ink">
          Stats
        </h1>
        <div class="flex-1" />
        <OwSpinner v-if="stats.loading" :size="14" />
        <OwChoice
          :options="RANGES"
          :model-value="stats.range"
          @update:model-value="v => stats.load(v as StatsRange)"
        />
      </header>

      <div v-if="s" class="mx-auto max-w-[980px] px-6 py-7">
        <p v-if="empty" class="rounded-xl border border-ow-border bg-ow-surface px-4 py-8 text-center text-sm text-ow-muted">
          Nothing to show for this stretch yet. Tick a few tasks off and this page fills itself in.
        </p>

        <div v-else class="flex flex-col gap-9">
          <!-- Tier 1 — the headline -->
          <section>
            <h3 :class="heading">
              FOLLOW-THROUGH
            </h3>
            <div :class="tiles">
              <StatTile label="OF WHAT YOU PLANNED" :hint="`${s.closedOfPlanned} of ${s.planned} finished`">
                {{ followThrough }}<span class="text-[19px] text-ow-muted">%</span>
              </StatTile>
              <StatTile label="TASKS CLOSED" :hint="`since ${format(parseISO(s.from), 'd MMMM')}`">
                {{ s.closed }}
              </StatTile>
              <StatTile label="CURRENT STREAK" hint="days in a row with something finished">
                {{ s.currentStreak }}
              </StatTile>
              <StatTile label="LONGEST STREAK" hint="your best run this year">
                {{ s.longestStreak }}
              </StatTile>
            </div>

            <div :class="[card, 'mt-3']">
              <div class="mb-3 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
                WHEN THEY GOT DONE
              </div>
              <SplitBar :parts="splitParts" />
              <p :class="note">
                Measured against the day a task was <em>first</em> planned for, so moving it forward
                still counts against the day you meant to do it.
              </p>
            </div>
          </section>

          <!-- Tier 2 — patterns -->
          <section>
            <h3 :class="heading">
              A YEAR OF TICKS
            </h3>
            <div :class="card">
              <YearHeatmap :days="s.heatmap" :week-starts-on="weekStartsOn" />
            </div>
          </section>

          <section class="grid gap-3 lg:grid-cols-2">
            <div :class="card">
              <div :class="heading">
                BY DAY OF THE WEEK
              </div>
              <ColumnChart :bars="weekdayBars" />
            </div>
            <div :class="card">
              <div :class="heading">
                BY HOUR
              </div>
              <ColumnChart :bars="hourBars" :label-every="3" />
            </div>
          </section>

          <section>
            <h3 :class="heading">
              {{ trendHeading }}
            </h3>
            <div :class="card">
              <ColumnChart :bars="trendBars" :label-every="trendLabelEvery" :height="140" />
              <p :class="note">
                Each column is one {{ s.trendUnit }}: the full height is what you planned into it,
                the filled part is what you finished.
              </p>
            </div>
          </section>

          <!-- Tier 3 — planning quality -->
          <section>
            <h3 :class="heading">
              HOW THE PLANNING HELD UP
            </h3>
            <div :class="tiles">
              <StatTile label="TYPICAL SLIP" hint="between the day planned and the day done">
                {{ days(s.medianSlipDays) }}
              </StatTile>
              <StatTile label="TYPICAL TIME TO CLOSE" hint="from writing it down to ticking it">
                {{ days(s.medianDaysToClose) }}
              </StatTile>
              <StatTile label="CARRIED FORWARD" hint="sitting later than first planned">
                {{ s.rolled }}
              </StatTile>
              <StatTile label="A DAY, ON AVERAGE" :hint="`${s.plannedPerDay} planned · ${s.closedPerDay} closed`">
                {{ s.closedPerDay }}<span class="text-[19px] text-ow-muted">/{{ s.plannedPerDay }}</span>
              </StatTile>
            </div>
            <p v-if="s.oldestOpen" :class="[note, 'mt-3.5']">
              Your oldest open task is “{{ s.oldestOpen.title }}”, written
              {{ formatDistanceToNow(parseISO(s.oldestOpen.createdAt)) }} ago.
            </p>
          </section>

          <!-- Tier 4 — composition -->
          <section class="grid gap-3 lg:grid-cols-2">
            <div :class="card">
              <div :class="heading">
                BY HIGHLIGHT
              </div>
              <div class="flex flex-col gap-2">
                <BarRow
                  v-for="b in s.byInk"
                  :key="b.key"
                  :label="b.label"
                  :value="b.closed"
                  :total="b.total"
                  :color="b.color"
                />
              </div>
            </div>

            <div :class="card">
              <div :class="heading">
                BY LIST
              </div>
              <div v-if="s.byList.length" class="flex flex-col gap-2">
                <BarRow
                  v-for="b in s.byList"
                  :key="b.key"
                  :label="b.label"
                  :value="b.closed"
                  :total="b.total"
                  :color="b.color"
                />
              </div>
              <p v-else class="text-[13px] text-ow-muted">
                No lists yet.
              </p>
              <p :class="note">
                Lists are counted whole rather than over the chosen stretch — what is sitting in
                them is a question about age, not about the last few weeks.
              </p>
            </div>
          </section>

          <section v-if="s.fromCalendar.total">
            <h3 :class="heading">
              FROM YOUR CALENDAR
            </h3>
            <p class="text-[13.5px] text-ow-text">
              Tasks that came in from a calendar: {{ s.fromCalendar.closed }} of
              {{ s.fromCalendar.total }} finished.
            </p>
          </section>
        </div>
      </div>

      <p v-else class="mx-auto max-w-[980px] px-6 py-7 text-sm text-ow-muted">
        Loading…
      </p>
    </main>
  </div>
</template>
