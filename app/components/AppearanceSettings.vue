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

// `style` previews each face in itself.
const TYPEFACES = (
  [
    { v: 'open-sans', label: 'Open Sans' },
    { v: 'lato', label: 'Lato' },
    { v: 'roboto', label: 'Roboto' },
    { v: 'inter', label: 'Inter' },
    { v: 'source-sans-3', label: 'Source Sans 3' },
    { v: 'bricolage-grotesque', label: 'Bricolage' },
  ] as const
).map(f => ({ ...f, style: { fontFamily: FONT_STACKS[f.v] } }))

const HIGHLIGHT_STYLES = [
  { v: 'fill', label: 'Full background' },
  { v: 'edge', label: 'Left edge' },
] as const

const TEXT_SIZES = [
  { v: 'small', label: 'Small' },
  { v: 'default', label: 'Default' },
  { v: 'large', label: 'Large' },
] as const

const WEEK_STARTS = [
  { v: 1, label: 'Monday' },
  { v: 0, label: 'Sunday' },
] as const

// Filled after mount rather than during setup: on the server this resolves to the
// container's zone, which would not match the browser's and would break hydration.
const browserTimezone = ref('')
onMounted(() => {
  browserTimezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
})

// A row written by the seed — or before this control existed — can hold a zone this runtime
// does not enumerate, so the current value is folded in rather than silently dropped.
const TIMEZONES = computed(() => {
  const zones = new Set<string>(['UTC', ...Intl.supportedValuesOf('timeZone')])
  if (store.settings?.timezone) zones.add(store.settings.timezone)
  return [...zones].sort()
})

const heading = 'mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-ow-faint'
const note = 'mt-2.5 max-w-[560px] text-[13px] leading-relaxed text-ow-muted'
</script>

<template>
  <div v-if="store.settings" class="flex flex-col gap-8">
    <section>
      <h3 :class="heading">
        THEME
      </h3>
      <OwChoice
        :options="THEMES"
        :model-value="store.settings.theme"
        @update:model-value="v => set('theme', v as Settings['theme'])"
      />
    </section>

    <section>
      <h3 :class="heading">
        ACCENT
      </h3>
      <div class="flex gap-2">
        <OwSwatch
          v-for="a in ACCENTS"
          :key="a"
          :color="accentVar(a)"
          :label="ACCENT_LABELS[a]"
          :selected="store.settings.accentColor === a"
          :size="28"
          @click="set('accentColor', a)"
        />
      </div>
    </section>

    <section>
      <h3 :class="heading">
        TYPEFACE
      </h3>
      <OwChoice
        :options="TYPEFACES"
        :model-value="store.settings.fontStyle"
        @update:model-value="v => set('fontStyle', v as Settings['fontStyle'])"
      />
    </section>

    <section>
      <h3 :class="heading">
        HIGHLIGHT STYLE
      </h3>
      <OwChoice
        :options="HIGHLIGHT_STYLES"
        :model-value="store.settings.tagStyle"
        @update:model-value="v => set('tagStyle', v as Settings['tagStyle'])"
      />
      <p :class="note">
        How a task's highlight colour is shown. Calendar events keep their own look — a coloured
        dot and no checkbox — whichever you choose.
      </p>
    </section>

    <section>
      <h3 :class="heading">
        TEXT SIZE
      </h3>
      <OwChoice
        :options="TEXT_SIZES"
        :model-value="store.settings.textSize"
        @update:model-value="v => set('textSize', v as Settings['textSize'])"
      />
    </section>

    <section>
      <h3 :class="heading">
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
      <label class="mt-3.5 flex items-center gap-3 text-sm text-ow-ink">
        <OwSwitch
          :model-value="store.settings.showLists"
          size="lg"
          label="Show lists under the week"
          @update:model-value="set('showLists', $event)"
        />
        <span>Show lists under the week</span>
        <span class="text-[13px] text-ow-muted">also a toggle in the toolbar</span>
      </label>
      <p :class="note">
        Off gives the week the whole window. The lists themselves are untouched — a task can
        still be sent to one from its “Move to…” menu.
      </p>
      <label class="mt-3.5 flex items-center gap-3 text-sm text-ow-ink">
        <OwSwitch
          :model-value="store.settings.showWeekStats"
          size="lg"
          label="Show the stats line above the week"
          @update:model-value="set('showWeekStats', $event)"
        />
        <span>Show the stats line above the week</span>
      </label>
      <p :class="note">
        A quiet line carrying your streak and how the last four weeks went. Off hides it; the
        full picture is still on the Stats page.
      </p>
    </section>

    <section>
      <h3 :class="heading">
        TIME ZONE
      </h3>
      <label class="flex flex-wrap items-center gap-3 text-sm text-ow-ink">
        <span>Days begin and end in</span>
        <select
          :value="store.settings.timezone"
          class="rounded-[9px] border border-ow-border bg-ow-surface px-2.5 py-1.5 text-[13.5px]"
          @change="set('timezone', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="tz in TIMEZONES" :key="tz" :value="tz">
            {{ tz }}
          </option>
        </select>
        <OwButton
          v-if="browserTimezone && browserTimezone !== store.settings.timezone"
          size="sm"
          @click="set('timezone', browserTimezone)"
        >
          Use {{ browserTimezone }}
        </OwButton>
      </label>
      <p :class="note">
        Which clock decides when one day becomes the next. Rollover waits for midnight here,
        calendar events land on their day here, and Stats counts a finished task on the day you
        ticked it here. New accounts start on UTC.
      </p>
    </section>

    <section>
      <h3 :class="heading">
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
      <p :class="note">
        Finished tasks fold into a quiet “3 done” line at the bottom of each day and list.
        Click it to look back over them.
      </p>
    </section>

    <section>
      <h3 :class="heading">
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
      <p :class="note">
        Each morning, open tasks from past days move to today and keep a ↻ mark showing where
        they came from. Off by default.
      </p>
    </section>

    <section>
      <h3 :class="heading">
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
      <label class="mt-3.5 flex items-center gap-3 text-sm text-ow-ink">
        <OwSwitch
          :model-value="store.settings.hideConvertedEvents"
          size="lg"
          label="Hide events that became tasks"
          @update:model-value="set('hideConvertedEvents', $event)"
        />
        <span>Hide events that became tasks</span>
      </label>
      <p :class="note">
        When you turn an event into a task with ＋ task, the event itself steps aside so the
        same meeting is not listed twice. Delete the task and the event comes back.
      </p>
    </section>
  </div>
  <p v-else class="text-sm text-ow-muted">
    Loading…
  </p>
</template>
