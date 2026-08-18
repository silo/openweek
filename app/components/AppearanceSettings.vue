<script setup lang="ts">
import type { Settings } from '~~/shared/schemas/settings'
import { ACCENTS, ACCENT_LABELS, accentVar } from '~~/shared/constants/colors'
import { FONT_STACKS } from '~/composables/useTheme'

const store = useSettingsStore()

function set<K extends keyof Settings>(key: K, value: Settings[K]) {
  store.update({ [key]: value })
}

const THEMES = [
  { v: 'paper', label: 'Paper' },
  { v: 'ink', label: 'Ink' },
  { v: 'system', label: 'System' },
] as const

const TYPEFACES = [
  { v: 'open-sans', label: 'Open Sans' },
  { v: 'lato', label: 'Lato' },
  { v: 'roboto', label: 'Roboto' },
  { v: 'inter', label: 'Inter' },
  { v: 'source-sans-3', label: 'Source Sans 3' },
  { v: 'bricolage-grotesque', label: 'Bricolage' },
] as const

const TEXT_SIZES = [
  { v: 'small', label: 'Small' },
  { v: 'default', label: 'Default' },
  { v: 'large', label: 'Large' },
] as const

const HIGHLIGHT_STYLES = [
  { v: 'fill', label: 'Full background' },
  { v: 'edge', label: 'Left edge' },
] as const

const WEEK_STARTS = [
  { v: 1, label: 'Monday' },
  { v: 0, label: 'Sunday' },
] as const
</script>

<template>
  <div v-if="store.settings" class="flex flex-col gap-8">
    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        THEME
      </h3>
      <div class="flex gap-2">
        <button
          v-for="t in THEMES"
          :key="t.v"
          type="button"
          :aria-pressed="store.settings.theme === t.v"
          class="cursor-pointer rounded-[9px] border px-3.5 py-2 text-[13.5px] transition-colors"
          :class="store.settings.theme === t.v
            ? 'border-ow-select-edge bg-ow-select-bg font-semibold text-ow-ink'
            : 'border-ow-border bg-ow-surface text-ow-text hover:bg-ow-sunken'"
          @click="set('theme', t.v)"
        >
          {{ t.label }}
        </button>
      </div>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        ACCENT
      </h3>
      <div class="flex gap-2">
        <button
          v-for="a in ACCENTS"
          :key="a"
          type="button"
          :title="ACCENT_LABELS[a]"
          :aria-label="ACCENT_LABELS[a]"
          :aria-pressed="store.settings.accentColor === a"
          class="h-7 w-7 cursor-pointer rounded-lg border-none"
          :style="{
            background: accentVar(a),
            boxShadow: store.settings.accentColor === a
              ? '0 0 0 2px var(--ow-surface), 0 0 0 3.5px var(--ow-ink)'
              : 'none',
          }"
          @click="set('accentColor', a)"
        />
      </div>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        TYPEFACE
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in TYPEFACES"
          :key="f.v"
          type="button"
          :aria-pressed="store.settings.fontStyle === f.v"
          class="cursor-pointer rounded-[9px] border px-3.5 py-2 text-[13.5px] transition-colors"
          :class="store.settings.fontStyle === f.v
            ? 'border-ow-select-edge bg-ow-select-bg font-semibold text-ow-ink'
            : 'border-ow-border bg-ow-surface text-ow-text hover:bg-ow-sunken'"
          :style="{ fontFamily: FONT_STACKS[f.v] }"
          @click="set('fontStyle', f.v)"
        >
          {{ f.label }}
        </button>
      </div>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        HIGHLIGHT STYLE
      </h3>
      <div class="flex gap-2">
        <button
          v-for="h in HIGHLIGHT_STYLES"
          :key="h.v"
          type="button"
          :aria-pressed="store.settings.tagStyle === h.v"
          class="cursor-pointer rounded-[9px] border px-3.5 py-2 text-[13.5px] transition-colors"
          :class="store.settings.tagStyle === h.v
            ? 'border-ow-select-edge bg-ow-select-bg font-semibold text-ow-ink'
            : 'border-ow-border bg-ow-surface text-ow-text hover:bg-ow-sunken'"
          @click="set('tagStyle', h.v)"
        >
          {{ h.label }}
        </button>
      </div>
      <p class="mt-2.5 max-w-[560px] text-[13px] leading-relaxed text-ow-muted">
        How a task's highlight colour is shown. Calendar events keep their own look — a coloured
        dot and no checkbox — whichever you choose.
      </p>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        TEXT SIZE
      </h3>
      <div class="flex gap-2">
        <button
          v-for="s in TEXT_SIZES"
          :key="s.v"
          type="button"
          :aria-pressed="store.settings.textSize === s.v"
          class="cursor-pointer rounded-[9px] border px-3.5 py-2 text-[13.5px] transition-colors"
          :class="store.settings.textSize === s.v
            ? 'border-ow-select-edge bg-ow-select-bg font-semibold text-ow-ink'
            : 'border-ow-border bg-ow-surface text-ow-text hover:bg-ow-sunken'"
          @click="set('textSize', s.v)"
        >
          {{ s.label }}
        </button>
      </div>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        WEEK
      </h3>
      <label class="flex items-center gap-3 text-sm text-ow-ink">
        <span>Week starts on</span>
        <select
          :value="store.settings.weekStartsOn"
          class="rounded-[9px] border border-ow-border bg-ow-surface px-2.5 py-1.5 text-[13.5px]"
          @change="set('weekStartsOn', Number(($event.target as HTMLSelectElement).value) as 0 | 1)"
        >
          <option v-for="w in WEEK_STARTS" :key="w.v" :value="w.v">
            {{ w.label }}
          </option>
        </select>
      </label>
      <label class="mt-3.5 flex items-center gap-3 text-sm text-ow-ink">
        <OwSwitch
          :model-value="store.settings.showWeekends"
          size="lg"
          label="Show weekends"
          @update:model-value="set('showWeekends', $event)"
        />
        <span>Show weekends</span>
        <span class="text-[13px] text-ow-muted">also a toggle in the toolbar</span>
      </label>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        COMPLETED TASKS
      </h3>
      <label class="flex items-center gap-3 text-sm text-ow-ink">
        <OwSwitch
          :model-value="store.settings.collapseDone"
          size="lg"
          label="Collapse done tasks"
          @update:model-value="set('collapseDone', $event)"
        />
        <span>Collapse done tasks</span>
      </label>
      <p class="mt-2.5 max-w-[560px] text-[13px] leading-relaxed text-ow-muted">
        Finished tasks fold into a quiet “3 done” line at the bottom of each day and list.
        Click it to look back over them.
      </p>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        ROLLOVER
      </h3>
      <label class="flex items-center gap-3 text-sm text-ow-ink">
        <OwSwitch
          :model-value="store.settings.rolloverEnabled"
          size="lg"
          label="Roll unfinished tasks forward"
          @update:model-value="set('rolloverEnabled', $event)"
        />
        <span>Roll unfinished tasks forward</span>
      </label>
      <p class="mt-2.5 max-w-[560px] text-[13px] leading-relaxed text-ow-muted">
        Each morning, open tasks from past days move to today and keep a ↻ mark showing where
        they came from. Off by default.
      </p>
    </section>

    <section>
      <h3 class="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        CALENDAR EVENTS
      </h3>
      <label class="flex items-center gap-3 text-sm text-ow-ink">
        <OwSwitch
          :model-value="store.settings.showCalendarEvents"
          size="lg"
          label="Show calendar events in the week"
          @update:model-value="set('showCalendarEvents', $event)"
        />
        <span>Show calendar events in the week</span>
      </label>
    </section>
  </div>
  <p v-else class="text-sm text-ow-muted">
    Loading…
  </p>
</template>
