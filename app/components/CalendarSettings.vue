<script setup lang="ts">
import type { CalendarConnectionDto } from '~~/shared/schemas/calendar'

const connections = ref<CalendarConnectionDto[]>([])
const icalUrl = ref('')
const icalName = ref('')
const showCaldav = ref(false)
const caldav = reactive({ serverUrl: '', username: '', password: '', displayName: '' })
const busy = ref(false)
const errorMsg = ref('')

async function load() {
  connections.value = await apiFetch<CalendarConnectionDto[]>('/api/calendars')
}
function readErr(e: unknown) {
  return (e as { data?: { message?: string } })?.data?.message ?? 'Something went wrong'
}
async function addIcal() {
  if (!icalUrl.value.trim()) return
  busy.value = true; errorMsg.value = ''
  try {
    await apiFetch('/api/calendars', { method: 'POST', body: { provider: 'ical', url: icalUrl.value.trim(), displayName: icalName.value.trim() || undefined } })
    icalUrl.value = ''; icalName.value = ''
    await load()
  }
  catch (e) { errorMsg.value = readErr(e) }
  finally { busy.value = false }
}
async function addCaldav() {
  busy.value = true; errorMsg.value = ''
  try {
    await apiFetch('/api/calendars', { method: 'POST', body: { provider: 'caldav', ...caldav, displayName: caldav.displayName || undefined } })
    showCaldav.value = false
    Object.assign(caldav, { serverUrl: '', username: '', password: '', displayName: '' })
    await load()
  }
  catch (e) { errorMsg.value = readErr(e) }
  finally { busy.value = false }
}
async function syncNow(id: string) {
  busy.value = true
  try { await apiFetch(`/api/calendars/${id}/sync`, { method: 'POST' }); await load() }
  finally { busy.value = false }
}
async function remove(id: string) {
  busy.value = true
  try { await apiFetch(`/api/calendars/${id}`, { method: 'DELETE' }); await load() }
  finally { busy.value = false }
}

const inputClass = 'rounded-lg border border-ow-border bg-ow-bg px-3 py-2 font-body text-sm outline-none focus:border-ow-muted'
onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-5 font-display text-sm">
    <div v-if="connections.length" class="flex flex-col gap-2">
      <div v-for="c in connections" :key="c.id" class="flex items-center gap-3 rounded-lg border border-ow-border px-3 py-2">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: c.color }" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-ow-ink">{{ c.displayName }}</div>
          <div class="text-[10px] text-ow-faint">
            {{ c.provider.toUpperCase() }} ·
            <span :style="c.status === 'error' ? 'color:#C49097' : ''">{{ c.status === 'error' ? (c.lastError || 'error') : (c.lastSyncedAt ? 'synced' : 'never synced') }}</span>
          </div>
        </div>
        <button class="text-[11px] text-ow-muted hover:text-ow-ink" @click="syncNow(c.id)">Sync</button>
        <button class="text-[11px] text-ow-muted hover:opacity-80" style="color:#C49097" @click="remove(c.id)">Remove</button>
      </div>
    </div>
    <p v-else class="text-[12px] text-ow-faint">No calendars connected yet.</p>

    <p v-if="errorMsg" class="text-[12px]" style="color:#C49097">{{ errorMsg }}</p>

    <div class="flex flex-col gap-2">
      <div class="text-[10px] uppercase tracking-widest text-ow-faint">Add iCal feed</div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input v-model="icalUrl" :class="inputClass" class="flex-1" placeholder="https://…/basic.ics">
        <input v-model="icalName" :class="[inputClass, 'sm:w-40']" placeholder="Name (optional)">
        <button class="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60" style="background: var(--ow-accent); color: var(--ow-accent-ink);" :disabled="busy" @click="addIcal">Add</button>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <button class="self-start text-[11px] text-ow-muted hover:text-ow-ink" @click="showCaldav = !showCaldav">
        {{ showCaldav ? '−' : '＋' }} Connect CalDAV (Apple · Nextcloud · Fastmail)
      </button>
      <div v-if="showCaldav" class="flex flex-col gap-2">
        <input v-model="caldav.serverUrl" :class="inputClass" placeholder="Server URL (e.g. https://caldav.icloud.com)">
        <input v-model="caldav.username" :class="inputClass" placeholder="Username / email">
        <input v-model="caldav.password" :class="inputClass" type="password" placeholder="App-specific password">
        <button class="self-start rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60" style="background: var(--ow-accent); color: var(--ow-accent-ink);" :disabled="busy" @click="addCaldav">Connect</button>
      </div>
    </div>

    <a href="/api/calendars/google/start" class="self-start text-[11px] text-ow-muted hover:text-ow-ink">＋ Connect Google Calendar</a>
  </div>
</template>
