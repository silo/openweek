<script setup lang="ts">
import { PROVIDER_LABELS, inkColor } from '~~/shared/constants/colors'

const cals = useCalendarsStore()
const settings = useSettingsStore()

const showEvents = computed(() => settings.settings?.showCalendarEvents ?? true)
function toggleEvents() {
  settings.update({ showCalendarEvents: !showEvents.value })
}

const open = ref(false)
const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)

useDismissable(panel, () => (open.value = false), trigger)

</script>

<template>
  <div class="relative">
    <!-- Split control: the switch shows/hides every event, the rest opens the list. Two
         sibling buttons rather than one nested inside the other, which is invalid. -->
    <div
      ref="trigger"
      class="flex h-[34px] flex-none items-stretch overflow-hidden rounded-[9px] border transition-colors"
      :class="open ? 'border-ow-accent-edge bg-ow-accent-tint' : 'border-ow-border bg-ow-surface'"
    >
      <button
        type="button"
        role="switch"
        :aria-checked="showEvents"
        title="Show or hide calendar events in the week"
        aria-label="Show calendar events in the week"
        class="flex cursor-pointer items-center border-none bg-transparent pl-[9px] pr-2 transition-colors hover:bg-ow-sunken"
        @click="toggleEvents"
      >
        <OwSwitch :model-value="showEvents" as="span" size="sm" />
      </button>

      <span class="my-[6px] w-px flex-none bg-ow-border" aria-hidden="true" />

      <button
        type="button"
        class="flex cursor-pointer items-center gap-2 border-none bg-transparent px-[11px] text-[13.5px] transition-colors hover:bg-ow-sunken"
        :class="showEvents ? 'text-ow-title' : 'text-ow-ghost'"
        :aria-expanded="open"
        aria-haspopup="true"
        @click="open = !open"
      >
        <span class="flex gap-[3px]" aria-hidden="true">
          <span
            v-for="s in cals.sources"
            :key="s.id"
            class="h-[14px] w-[6px] rounded-[2px]"
            :style="{ background: showEvents && s.enabled ? inkColor(s.color) : 'var(--ow-track)' }"
          />
        </span>
        <span>Calendars</span>
        <span class="font-semibold" :class="showEvents ? 'text-ow-secondary' : 'text-ow-ghost'">
          {{ cals.shownCount }}/{{ cals.totalCount }}
        </span>
      </button>
    </div>

    <div
      v-if="open"
      ref="panel"
      class="absolute right-0 top-[42px] z-[75] w-[326px] rounded-[13px] border border-ow-border bg-ow-surface p-2 shadow-ow-2"
    >
      <div class="flex items-center gap-2.5 px-[9px] pb-[9px] pt-[7px]">
        <span class="text-xs font-semibold tracking-[0.06em] text-ow-faint">CONNECTED CALENDARS</span>
        <div class="flex-1" />
        <OwButton v-if="!cals.none" size="sm" @click="cals.toggleAll()">
          {{ cals.allShown ? 'Hide all' : 'Show all' }}
        </OwButton>
      </div>

      <p v-if="cals.none" class="px-[9px] pb-2 text-[13px] leading-relaxed text-ow-muted">
        No calendars connected.
        <NuxtLink to="/settings" class="underline">
          Settings → Calendars
        </NuxtLink>
        to mirror Google, CalDAV or an iCal feed.
      </p>

      <button
        v-for="s in cals.sources"
        :key="s.id"
        type="button"
        class="flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-none bg-transparent px-[9px] py-2 text-left transition-colors hover:bg-ow-inset"
        role="switch"
        :aria-checked="s.enabled"
        @click="cals.toggle(s.id)"
      >
        <span
          class="h-[22px] w-[9px] flex-none rounded-[3px]"
          :style="{ background: s.enabled ? inkColor(s.color) : 'var(--ow-track)' }"
        />
        <span class="flex min-w-0 flex-1 flex-col gap-px">
          <span class="truncate text-sm font-medium" :class="s.enabled ? 'text-ow-ink' : 'text-ow-muted'">{{ s.name }}</span>
          <span class="truncate text-[11.5px] text-ow-muted">{{ cals.accountFor(s) }}</span>
        </span>
        <span class="rounded-[5px] bg-ow-sunken px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ow-faint">
          {{ PROVIDER_LABELS[cals.providerFor(s)] }}
        </span>
        <OwSwitch :model-value="s.enabled" as="span" />
      </button>

      <div v-if="!cals.none" class="mx-[5px] my-1.5 h-px bg-ow-hairline" />

      <p v-if="!cals.none" class="px-[9px] pb-[7px] pt-0.5 text-[12.5px] leading-relaxed text-ow-muted">
        Events are read-only and carry their calendar's name. Add or remove feeds in
        <NuxtLink to="/settings" class="underline">
          Settings → Calendars
        </NuxtLink>.
      </p>
    </div>
  </div>
</template>
