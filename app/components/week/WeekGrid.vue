<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import { useWeek } from '~/composables/useWeek'
import { useBoardStore } from '~/stores/board'

const user = useAuthUser()
const store = useBoardStore()

const weekStartsOn = computed(() => (user.value?.weekStartsOn ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6)
const { days, rangeLabel, next, prev, thisWeek, offset } = useWeek(weekStartsOn.value)

const range = computed(() => ({ from: days.value[0]!.iso, to: days.value[6]!.iso }))

// Load the week through the store whenever the range changes; roll over once on first load.
let rolledOver = false
watch(range, async ({ from, to }) => {
  await store.loadWeek(from, to)
  if (!rolledOver && user.value?.rolloverEnabled) {
    rolledOver = true
    store.rollover(from, to)
  }
}, { immediate: true })

// --- mobile single-day view ---
const selected = ref(0)
onMounted(() => {
  const todayIdx = days.value.findIndex(d => d.isToday)
  selected.value = todayIdx >= 0 ? todayIdx : 0
})
const showSomeday = ref(false)
const selectedDay = computed(() => days.value[selected.value]!)

const swipeArea = ref<HTMLElement>()
useSwipe(swipeArea, {
  onSwipeEnd(_e, direction) {
    if (showSomeday.value)
      return
    if (direction === 'left') {
      if (selected.value < 6)
        selected.value++
      else { next(); selected.value = 0 }
    }
    else if (direction === 'right') {
      if (selected.value > 0)
        selected.value--
      else { prev(); selected.value = 6 }
    }
  },
})

// Keep the selected index valid after week nav.
watch(offset, () => { selected.value = Math.min(selected.value, 6) })
</script>

<template>
  <div class="flex h-full flex-col">
    <header class="flex items-center justify-between border-b border-hairline px-4 py-3">
      <h1 class="font-accent text-3xl">
        Openweek
      </h1>
      <div class="flex items-center gap-1">
        <span class="mr-2 hidden text-sm opacity-70 sm:inline">{{ rangeLabel }}</span>
        <button class="btn btn-ghost btn-sm" aria-label="Previous week" @click="prev">‹</button>
        <button class="btn btn-ghost btn-sm" @click="thisWeek">Today</button>
        <button class="btn btn-ghost btn-sm" aria-label="Next week" @click="next">›</button>
        <ThemeToggle />
        <NuxtLink to="/settings" class="btn btn-ghost btn-sm" aria-label="Settings">⚙</NuxtLink>
      </div>
    </header>

    <!-- Desktop: 7 day columns + a Someday column holding the lists -->
    <div class="hidden flex-1 grid-cols-8 divide-x divide-hairline overflow-auto md:grid">
      <DayColumn v-for="day in days" :key="day.iso" :day="day" />
      <div class="flex flex-col divide-y divide-hairline bg-base-100/40">
        <DayColumn v-for="list in store.sortedLists" :key="list.id" :list="list" />
        <AddList />
      </div>
    </div>

    <!-- Mobile: week strip + single day (swipeable) or Someday sheet -->
    <div class="flex flex-1 flex-col md:hidden">
      <nav class="flex items-stretch border-b border-hairline">
        <button
          v-for="(day, i) in days"
          :key="day.iso"
          type="button"
          class="flex flex-1 flex-col items-center py-1.5 text-xs"
          :class="[!showSomeday && selected === i ? 'border-b-2 border-primary font-medium' : 'opacity-60', day.isToday ? 'text-primary' : '']"
          @click="showSomeday = false; selected = i"
        >
          <span>{{ day.dayName }}</span>
          <span class="tabular-nums">{{ day.dayNumber }}</span>
        </button>
        <button
          type="button"
          class="flex flex-col items-center justify-center px-3 text-xs"
          :class="showSomeday ? 'border-b-2 border-primary font-medium' : 'opacity-60'"
          @click="showSomeday = true"
        >
          ⋯
        </button>
      </nav>

      <div ref="swipeArea" class="flex-1 overflow-auto">
        <template v-if="showSomeday">
          <div class="divide-y divide-hairline">
            <DayColumn v-for="list in store.sortedLists" :key="list.id" :list="list" />
            <AddList />
          </div>
        </template>
        <DayColumn v-else :key="selectedDay.iso" :day="selectedDay" />
      </div>
    </div>

    <TaskEditor />
  </div>
</template>
