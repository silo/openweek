<script setup lang="ts">
import { format, getISOWeek, isSameMonth } from 'date-fns'
import { useWeek } from '~/composables/useWeek'
import { useBoardStore } from '~/stores/board'
import { signOut } from '~/utils/auth-client'

// Self-contained: useWeek shares its offset via useState, so this stays in sync
// with the grid without prop threading.
const { days, next, prev, thisWeek } = useWeek()
const store = useBoardStore()
const user = useAuthUser()
const search = useState('week-search', () => '')

const rangeLabel = computed(() => {
  const first = days.value[0]!.date
  const last = days.value[6]!.date
  return isSameMonth(first, last)
    ? `${format(first, 'MMMM d')} – ${format(last, 'd')}`
    : `${format(first, 'MMM d')} – ${format(last, 'MMM d')}`
})
const weekNumber = computed(() => getISOWeek(days.value[0]!.date))

// Progress over the visible week (top-level tasks only).
const progress = computed(() => {
  let done = 0
  let total = 0
  for (const day of days.value) {
    for (const t of store.tasksForDate(day.iso)) {
      if (t.parentId)
        continue
      total++
      if (t.done)
        done++
    }
  }
  return { done, total }
})

async function logout() {
  await signOut()
  await navigateTo('/login')
}
</script>

<template>
  <header class="flex items-center gap-6 border-b border-hairline px-6 py-3">
    <div class="flex items-center gap-2">
      <span class="size-4 rounded bg-accent" />
      <span class="font-mono text-[15px] font-semibold tracking-tight lowercase">openweek</span>
    </div>

    <div class="flex items-center gap-3">
      <button class="text-base text-base-content/40 hover:text-base-content" aria-label="Previous week" @click="prev">‹</button>
      <h1 class="m-0 font-mono text-xl font-semibold tracking-tight">
        {{ rangeLabel }}
      </h1>
      <button class="text-base text-base-content/40 hover:text-base-content" aria-label="Next week" @click="next">›</button>
      <button class="rounded-full border border-hairline px-2.5 py-0.5 font-mono text-[11px] text-base-content/60 hover:text-base-content" @click="thisWeek">
        Today
      </button>
      <span class="font-mono text-[10px] tracking-widest text-base-content/40">WEEK {{ weekNumber }}</span>
    </div>

    <div class="ml-auto flex items-center gap-3">
      <ClientOnly><CalendarsDropdown /></ClientOnly>
      <span class="font-mono text-[11px] text-base-content/50">{{ progress.done }} of {{ progress.total }} done</span>
      <ThemeToggle />
      <label class="flex items-center gap-1 rounded-full border border-hairline px-2 py-1">
        <span class="text-xs opacity-50">⌕</span>
        <input v-model="search" type="search" placeholder="Filter" class="w-20 bg-transparent font-mono text-[11px] focus:w-32 focus:outline-none">
      </label>
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="grid size-8 cursor-pointer place-items-center rounded-full bg-accent/40 font-mono text-xs" :aria-label="`Account: ${user?.name ?? ''}`">
          {{ (user?.name ?? 'U').charAt(0).toUpperCase() }}
        </div>
        <ul tabindex="0" class="dropdown-content menu z-30 mt-2 w-52 rounded-box border border-hairline bg-base-100 p-2 text-sm shadow">
          <li class="menu-title px-2 py-1">
            <div class="truncate font-medium text-base-content">{{ user?.name }}</div>
            <div class="truncate text-xs opacity-60">{{ user?.email }}</div>
          </li>
          <li><NuxtLink to="/settings">Settings</NuxtLink></li>
          <li v-if="user?.role === 'admin'"><NuxtLink to="/admin/users">Admin · Users</NuxtLink></li>
          <li><button type="button" @click="logout">Sign out</button></li>
        </ul>
      </div>
    </div>
  </header>
</template>
