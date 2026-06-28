<script setup lang="ts">
import { useBoardStore } from '~/stores/board'

interface Cal {
  id: string
  name: string | null
  enabled: boolean
  provider: string
  accountLabel: string
}

const store = useBoardStore()
// $fetch on mount (not useFetch) so the count is always fresh — useFetch would
// serve a stale cached result shared with the settings page.
const calendars = ref<Cal[]>([])
async function refresh() {
  calendars.value = await $fetch<Cal[]>('/api/sync/calendars').catch(() => [])
}
onMounted(refresh)

const SRC: Record<string, string> = { google: '#86B08B', caldav: '#9CBBD6', ical: '#D3B488' }
const dots = computed(() => [...new Set(calendars.value.map(c => c.provider))].map(p => SRC[p] ?? '#9CBBD6'))
const syncing = ref(false)

async function toggle(c: Cal) {
  await $fetch(`/api/sync/calendars/${c.id}`, { method: 'PATCH', body: { enabled: !c.enabled } }).catch(() => {})
  await refresh()
  await store.reloadWeek()
}

async function syncNow() {
  syncing.value = true
  await $fetch('/api/sync/now', { method: 'POST', body: {} }).catch(() => {})
  syncing.value = false
  await refresh()
  await store.reloadWeek()
}
</script>

<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="flex cursor-pointer items-center gap-2">
      <span class="flex gap-0.5">
        <span v-for="(d, i) in dots" :key="i" class="size-2 rounded-full" :style="{ background: d }" />
        <span v-if="!dots.length" class="size-2 rounded-full bg-base-300" />
      </span>
      <span class="font-mono text-[11px] text-base-content/55">{{ calendars.length }} calendar{{ calendars.length === 1 ? '' : 's' }}</span>
      <span class="text-[9px] text-base-content/40">▾</span>
    </div>
    <div tabindex="0" class="dropdown-content z-30 mt-2 w-64 rounded-box border border-hairline bg-base-100 p-2 shadow">
      <div v-if="!calendars.length" class="px-2 py-3 text-center text-sm opacity-60">
        No calendars yet.
        <NuxtLink to="/settings" class="link">Connect one</NuxtLink>
      </div>
      <ul v-else class="flex flex-col">
        <li v-for="c in calendars" :key="c.id">
          <label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-base-200">
            <input type="checkbox" class="checkbox checkbox-xs" :checked="c.enabled" @change="toggle(c)">
            <span class="size-2 rounded-full" :style="{ background: SRC[c.provider] ?? '#9CBBD6' }" />
            <span class="flex-1 truncate">{{ c.name }}</span>
          </label>
        </li>
      </ul>
      <div class="mt-1 flex items-center justify-between border-t border-hairline px-2 pt-2">
        <NuxtLink to="/settings" class="text-xs link link-hover opacity-70">Manage…</NuxtLink>
        <button class="btn btn-ghost btn-xs" :disabled="syncing" @click="syncNow">{{ syncing ? 'Syncing…' : 'Sync now' }}</button>
      </div>
    </div>
  </div>
</template>
