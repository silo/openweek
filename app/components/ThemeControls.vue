<script setup lang="ts">
import type { Settings, SettingsUpdate } from '~~/shared/schemas/settings'

const store = useSettingsStore()

function set<K extends keyof Settings>(key: K, value: Settings[K]) {
  store.update({ [key]: value } as SettingsUpdate)
}

const themes = [{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }, { v: 'system', l: 'System' }] as const
const accents = [{ v: '#CBDDE9', l: 'Sky' }, { v: '#EAD9A0', l: 'Butter' }, { v: '#CFE0CB', l: 'Mint' }, { v: '#E7CDD4', l: 'Rose' }]
const fonts = [{ v: 'plex-mono', l: 'Mono' }, { v: 'editorial', l: 'Editorial' }, { v: 'grotesk', l: 'Grotesk' }, { v: 'typewriter', l: 'Typewriter' }] as const
const tags = [{ v: 'underline', l: 'Underline' }, { v: 'swipe', l: 'Swipe' }] as const
const weekStarts = [{ v: 1, l: 'Monday' }, { v: 0, l: 'Sunday' }] as const

const segBtn = 'rounded-md px-3 py-1 transition-colors'
const segActive = 'bg-ow-sunken text-ow-ink shadow-sm'
const segIdle = 'text-ow-muted hover:text-ow-ink'
</script>

<template>
  <div v-if="store.settings" class="flex flex-col gap-6 font-display text-sm">
    <div>
      <div class="mb-2 text-xs uppercase tracking-widest text-ow-faint">Theme</div>
      <div class="inline-flex rounded-lg border border-ow-border p-0.5">
        <button v-for="o in themes" :key="o.v" :class="[segBtn, store.settings.theme === o.v ? segActive : segIdle]" @click="set('theme', o.v)">{{ o.l }}</button>
      </div>
    </div>

    <div>
      <div class="mb-2 text-xs uppercase tracking-widest text-ow-faint">Accent</div>
      <div class="flex gap-2">
        <button
          v-for="a in accents" :key="a.v" :title="a.l" :aria-label="a.l"
          class="h-7 w-7 rounded-md border-2"
          :style="{ background: a.v, borderColor: store.settings.accentColor === a.v ? 'var(--ow-ink)' : 'transparent' }"
          @click="set('accentColor', a.v)"
        />
      </div>
    </div>

    <div>
      <div class="mb-2 text-xs uppercase tracking-widest text-ow-faint">Font</div>
      <div class="inline-flex rounded-lg border border-ow-border p-0.5">
        <button v-for="o in fonts" :key="o.v" :class="[segBtn, store.settings.fontStyle === o.v ? segActive : segIdle]" @click="set('fontStyle', o.v)">{{ o.l }}</button>
      </div>
    </div>

    <div>
      <div class="mb-2 text-xs uppercase tracking-widest text-ow-faint">Highlighter</div>
      <div class="inline-flex rounded-lg border border-ow-border p-0.5">
        <button v-for="o in tags" :key="o.v" :class="[segBtn, store.settings.tagStyle === o.v ? segActive : segIdle]" @click="set('tagStyle', o.v)">{{ o.l }}</button>
      </div>
    </div>

    <div>
      <div class="mb-2 text-xs uppercase tracking-widest text-ow-faint">Week starts</div>
      <div class="inline-flex rounded-lg border border-ow-border p-0.5">
        <button v-for="o in weekStarts" :key="o.v" :class="[segBtn, store.settings.weekStartsOn === o.v ? segActive : segIdle]" @click="set('weekStartsOn', o.v)">{{ o.l }}</button>
      </div>
    </div>

    <label class="flex items-center gap-3">
      <input type="checkbox" class="toggle toggle-sm" :checked="store.settings.showCalendarEvents" @change="set('showCalendarEvents', ($event.target as HTMLInputElement).checked)">
      <span>Show calendar events in the grid</span>
    </label>

    <label class="flex items-center gap-3">
      <input type="checkbox" class="toggle toggle-sm" :checked="store.settings.rolloverEnabled" @change="set('rolloverEnabled', ($event.target as HTMLInputElement).checked)">
      <span>Roll unfinished tasks forward to today</span>
    </label>
  </div>
  <p v-else class="font-display text-sm text-ow-muted">Loading…</p>
</template>
