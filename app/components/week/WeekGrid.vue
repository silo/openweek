<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import { useWeek } from '~/composables/useWeek'
import { useBoardStore } from '~/stores/board'

const user = useAuthUser()
const store = useBoardStore()

const { days, next, prev, offset } = useWeek()
const desktopScroll = ref<HTMLElement>()

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
const selectedDay = computed(() => days.value[selected.value]!)

const swipeArea = ref<HTMLElement>()
useSwipe(swipeArea, {
  onSwipeEnd(_e, direction) {
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
watch(offset, () => { selected.value = Math.min(selected.value, 6) })

useTaskDndMonitor([desktopScroll, swipeArea])
</script>

<template>
  <div class="flex h-full flex-col bg-base-100">
    <TopBar />

    <!-- Desktop: 7 equal day columns + bottom list drawer -->
    <div class="hidden min-h-0 flex-1 flex-col md:flex">
      <div ref="desktopScroll" class="grid flex-1 grid-cols-7 divide-x divide-hairline overflow-auto">
        <DayColumn v-for="day in days" :key="day.iso" :day="day" />
      </div>
      <ListDrawer />
    </div>

    <!-- Mobile: week strip + single day (swipeable) + drawer -->
    <div class="flex min-h-0 flex-1 flex-col md:hidden">
      <nav class="flex items-stretch border-b border-hairline">
        <button
          v-for="(day, i) in days"
          :key="day.iso"
          type="button"
          class="flex flex-1 flex-col items-center py-1.5 font-mono text-[11px]"
          :class="[selected === i ? 'border-b-2 border-accent font-medium' : 'opacity-50', day.isToday ? 'font-semibold' : '']"
          @click="selected = i"
        >
          <span>{{ day.dayName.toUpperCase() }}</span>
          <span class="tabular-nums">{{ day.dayNumber }}</span>
        </button>
      </nav>
      <div ref="swipeArea" class="flex-1 overflow-auto">
        <DayColumn :key="selectedDay.iso" :day="selectedDay" />
      </div>
      <ListDrawer />
    </div>

    <TaskEditor />
  </div>
</template>
