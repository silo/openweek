<script setup lang="ts">
import { ACCENT_HEX } from '~/composables/useTaskColors'
import { authClient, signOut } from '~/utils/auth-client'

const user = useAuthUser()

// --- Planner ---
const weekStartsOn = ref<number>(user.value?.weekStartsOn ?? 1)
const rolloverEnabled = ref<boolean>(user.value?.rolloverEnabled ?? false)
const timezone = ref<string>(user.value?.timezone ?? 'UTC')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

async function savePlanner() {
  error.value = ''
  saved.value = false
  saving.value = true
  const { error: err } = await authClient.updateUser({ weekStartsOn: weekStartsOn.value, rolloverEnabled: rolloverEnabled.value, timezone: timezone.value })
  saving.value = false
  if (err) {
    error.value = err.message ?? 'Could not save.'
    return
  }
  if (user.value) {
    user.value.weekStartsOn = weekStartsOn.value
    user.value.rolloverEnabled = rolloverEnabled.value
    user.value.timezone = timezone.value
  }
  saved.value = true
}

// --- Appearance (applied live) ---
const accents = Object.keys(ACCENT_HEX) as (keyof typeof ACCENT_HEX)[]
async function setAccent(a: string) {
  if (user.value)
    user.value.accentColor = a // the accent plugin watches this → live recolor
  await authClient.updateUser({ accentColor: a })
}
async function setTag(style: 'underline' | 'swipe') {
  if (user.value)
    user.value.tagStyle = style
  await authClient.updateUser({ tagStyle: style })
}
async function setShowEvents(v: boolean) {
  if (user.value)
    user.value.showCalendarEvents = v
  await authClient.updateUser({ showCalendarEvents: v })
}

// --- Calendars ---
interface Account { id: string, provider: string, label: string, lastSyncedAt: string | null }
interface Cal { id: string, name: string | null, enabled: boolean, provider: string }
const { data: accounts, refresh: refreshAccounts } = await useFetch<Account[]>('/api/sync/accounts', { default: () => [] })
const { data: calendars, refresh: refreshCals } = await useFetch<Cal[]>('/api/sync/calendars', { default: () => [] })

const showConnect = ref<'' | 'ical' | 'caldav'>('')
const form = reactive({ label: '', url: '', serverUrl: '', username: '', password: '' })
const connectErr = ref('')
const busy = ref(false)

async function refreshAll() {
  await Promise.all([refreshAccounts(), refreshCals()])
}
async function connectIcal() {
  connectErr.value = ''
  busy.value = true
  try {
    await $fetch('/api/sync/connect/ical', { method: 'POST', body: { label: form.label, url: form.url } })
    showConnect.value = ''
    form.label = ''
    form.url = ''
    await refreshAll()
  }
  catch (e) { connectErr.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Could not connect.' }
  finally { busy.value = false }
}
async function connectCaldav() {
  connectErr.value = ''
  busy.value = true
  try {
    await $fetch('/api/sync/connect/caldav', { method: 'POST', body: { label: form.label, serverUrl: form.serverUrl, username: form.username, password: form.password } })
    showConnect.value = ''
    Object.assign(form, { label: '', serverUrl: '', username: '', password: '' })
    await refreshAll()
  }
  catch (e) { connectErr.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Could not connect.' }
  finally { busy.value = false }
}
async function disconnect(id: string) {
  await $fetch(`/api/sync/accounts/${id}`, { method: 'DELETE' }).catch(() => {})
  await refreshAll()
}
async function toggleCal(c: Cal) {
  await $fetch(`/api/sync/calendars/${c.id}`, { method: 'PATCH', body: { enabled: !c.enabled } }).catch(() => {})
  await refreshCals()
}
async function syncNow() {
  busy.value = true
  await $fetch('/api/sync/now', { method: 'POST', body: {} }).catch(() => {})
  busy.value = false
  await refreshAll()
}

async function logout() {
  await signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="mx-auto w-full max-w-lg p-6">
    <header class="mb-6 flex items-center justify-between">
      <h1 class="font-mono text-3xl">
        Settings
      </h1>
      <NuxtLink to="/" class="link link-hover text-sm">
        ← Back to week
      </NuxtLink>
    </header>

    <section class="mb-8">
      <h2 class="mb-2 font-mono text-xs uppercase tracking-widest opacity-50">Account</h2>
      <div class="flex items-center justify-between border-b border-hairline py-2">
        <div>
          <p class="font-medium">{{ user?.name }}</p>
          <p class="text-sm opacity-70">{{ user?.email }}</p>
        </div>
        <span v-if="user?.role === 'admin'" class="badge badge-outline">admin</span>
      </div>
    </section>

    <section class="mb-8 flex flex-col gap-4">
      <h2 class="font-mono text-xs uppercase tracking-widest opacity-50">Appearance</h2>
      <div class="flex items-center justify-between">
        <span>Accent</span>
        <div class="flex gap-2">
          <button
            v-for="a in accents" :key="a" type="button"
            class="size-7 rounded-full border-2"
            :style="{ background: ACCENT_HEX[a] }"
            :class="(user?.accentColor ?? 'sky') === a ? 'border-base-content/50' : 'border-transparent'"
            :aria-label="a" @click="setAccent(a)"
          />
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span>Highlighter style</span>
        <div class="flex gap-1">
          <button type="button" class="btn btn-sm" :class="(user?.tagStyle ?? 'underline') === 'underline' ? 'btn-primary' : 'btn-ghost'" @click="setTag('underline')">Underline</button>
          <button type="button" class="btn btn-sm" :class="user?.tagStyle === 'swipe' ? 'btn-primary' : 'btn-ghost'" @click="setTag('swipe')">Swipe</button>
        </div>
      </div>
      <label class="flex items-center justify-between">
        <span>Show calendar events</span>
        <input type="checkbox" class="toggle" :checked="user?.showCalendarEvents !== false" @change="setShowEvents(($event.target as HTMLInputElement).checked)">
      </label>
    </section>

    <section class="mb-8 flex flex-col gap-4">
      <h2 class="font-mono text-xs uppercase tracking-widest opacity-50">Planner</h2>
      <label class="flex items-center justify-between">
        <span>Week starts on</span>
        <select v-model.number="weekStartsOn" class="select select-bordered select-sm w-40">
          <option :value="1">Monday</option>
          <option :value="0">Sunday</option>
          <option :value="6">Saturday</option>
        </select>
      </label>
      <label class="flex items-center justify-between">
        <span>Time zone</span>
        <input v-model="timezone" type="text" class="input input-bordered input-sm w-56" placeholder="e.g. Europe/Berlin">
      </label>
      <label class="flex items-center justify-between">
        <span>Auto-rollover unfinished tasks
          <span class="block text-sm opacity-60">Move past unfinished tasks to today on open.</span>
        </span>
        <input v-model="rolloverEnabled" type="checkbox" class="toggle">
      </label>
      <div class="flex items-center gap-3">
        <button class="btn btn-primary btn-sm" :disabled="saving" @click="savePlanner">{{ saving ? 'Saving…' : 'Save' }}</button>
        <span v-if="saved" class="text-sm text-success">Saved.</span>
        <span v-if="error" class="text-sm text-error">{{ error }}</span>
      </div>
    </section>

    <section class="mb-8 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="font-mono text-xs uppercase tracking-widest opacity-50">Calendars</h2>
        <button class="btn btn-ghost btn-xs" :disabled="busy" @click="syncNow">{{ busy ? '…' : 'Sync now' }}</button>
      </div>

      <div v-for="acc in accounts" :key="acc.id" class="rounded border border-hairline p-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ acc.label }}</p>
            <p class="text-xs opacity-50">{{ acc.provider }}<span v-if="acc.lastSyncedAt"> · synced {{ new Date(acc.lastSyncedAt).toLocaleString() }}</span></p>
          </div>
          <button class="btn btn-ghost btn-xs" @click="disconnect(acc.id)">Disconnect</button>
        </div>
        <ul class="mt-2 flex flex-col gap-1">
          <li v-for="c in calendars.filter(x => x.provider === acc.provider)" :key="c.id">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" class="checkbox checkbox-xs" :checked="c.enabled" @change="toggleCal(c)">
              <span>{{ c.name }}</span>
            </label>
          </li>
        </ul>
      </div>

      <div v-if="!accounts.length" class="text-sm opacity-60">No calendars connected.</div>

      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm" @click="showConnect = showConnect === 'ical' ? '' : 'ical'">+ iCal feed</button>
        <button class="btn btn-outline btn-sm" @click="showConnect = showConnect === 'caldav' ? '' : 'caldav'">+ CalDAV</button>
        <a class="btn btn-outline btn-sm" href="/api/sync/connect/google/start">+ Google</a>
      </div>

      <form v-if="showConnect === 'ical'" class="flex flex-col gap-2 rounded border border-hairline p-3" @submit.prevent="connectIcal">
        <input v-model="form.label" placeholder="Name" required class="input input-bordered input-sm">
        <input v-model="form.url" type="url" placeholder="https://…/feed.ics" required class="input input-bordered input-sm">
        <button class="btn btn-primary btn-sm" :disabled="busy">Connect iCal</button>
      </form>
      <form v-if="showConnect === 'caldav'" class="flex flex-col gap-2 rounded border border-hairline p-3" @submit.prevent="connectCaldav">
        <input v-model="form.label" placeholder="Name" required class="input input-bordered input-sm">
        <input v-model="form.serverUrl" type="url" placeholder="https://caldav.example.com" required class="input input-bordered input-sm">
        <input v-model="form.username" placeholder="Username" required class="input input-bordered input-sm">
        <input v-model="form.password" type="password" placeholder="App password" required class="input input-bordered input-sm">
        <button class="btn btn-primary btn-sm" :disabled="busy">Connect CalDAV</button>
      </form>
      <p v-if="connectErr" class="text-sm text-error">{{ connectErr }}</p>
    </section>

    <section class="flex items-center justify-between border-t border-hairline pt-4">
      <NuxtLink v-if="user?.role === 'admin'" to="/admin/users" class="link link-hover text-sm">Admin · Users</NuxtLink>
      <span v-else />
      <button class="btn btn-ghost btn-sm" @click="logout">Sign out</button>
    </section>
  </div>
</template>
