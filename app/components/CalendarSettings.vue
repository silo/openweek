<script setup lang="ts">
import { formatDistanceToNow, parseISO } from 'date-fns'
import { HIGHLIGHT_INKS, INK_LABELS, inkColor } from '~~/shared/constants/colors'

const cals = useCalendarsStore()

const icalUrl = ref('')
const icalName = ref('')
const showCaldav = ref(false)
const caldav = reactive({ serverUrl: '', username: '', password: '', displayName: '' })
const busy = ref<'ical' | 'caldav' | string | null>(null)
const errorMsg = ref('')
const editing = ref<string | null>(null)
const draftName = ref('')

const PROVIDER_LABEL = { google: 'Google', caldav: 'CalDAV', ical: 'iCal' } as const

function readErr(e: unknown) {
  return (e as { data?: { message?: string } })?.data?.message ?? 'Something went wrong'
}
function syncedLabel(at: string | null) {
  return at ? `synced ${formatDistanceToNow(parseISO(at))} ago` : 'never synced'
}

async function addIcal() {
  if (!icalUrl.value.trim()) return
  busy.value = 'ical'
  errorMsg.value = ''
  try {
    await apiFetch('/api/calendars', {
      method: 'POST',
      body: { provider: 'ical', url: icalUrl.value.trim(), displayName: icalName.value.trim() || undefined },
    })
    icalUrl.value = ''
    icalName.value = ''
    await cals.load()
  }
  catch (e) { errorMsg.value = readErr(e) }
  finally { busy.value = null }
}

async function addCaldav() {
  busy.value = 'caldav'
  errorMsg.value = ''
  try {
    await apiFetch('/api/calendars', {
      method: 'POST',
      body: { provider: 'caldav', ...caldav, displayName: caldav.displayName || undefined },
    })
    showCaldav.value = false
    Object.assign(caldav, { serverUrl: '', username: '', password: '', displayName: '' })
    await cals.load()
  }
  catch (e) { errorMsg.value = readErr(e) }
  finally { busy.value = null }
}

async function syncNow(id: string) {
  busy.value = id
  try {
    await apiFetch(`/api/calendars/${id}/sync`, { method: 'POST' })
    await cals.load()
  }
  finally { busy.value = null }
}

function startEdit(id: string, name: string) {
  editing.value = id
  draftName.value = name
}
function commitEdit(id: string) {
  const name = draftName.value.trim()
  editing.value = null
  if (name) cals.patchSource(id, { name })
}

const inputClass = 'rounded-[9px] border border-ow-border bg-ow-surface px-3 py-2 text-sm outline-none focus:border-ow-mark'

onMounted(() => {
  if (!cals.loaded) cals.load()
})
</script>

<template>
  <div class="flex flex-col gap-7">
    <section v-if="cals.connections.length">
      <div class="mb-3 flex items-center gap-3">
        <h3 class="text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
          ACCOUNTS
        </h3>
        <span class="text-[13px] text-ow-muted">
          Showing {{ cals.shownCount }} of {{ cals.totalCount }} calendars
        </span>
        <div class="flex-1" />
        <OwButton size="sm" @click="cals.toggleAll()">
          {{ cals.allShown ? 'Hide all' : 'Show all' }}
        </OwButton>
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="c in cals.connections"
          :key="c.id"
          class="rounded-xl border border-ow-border bg-ow-surface"
        >
          <div class="flex items-center gap-3 border-b border-ow-hairline px-3.5 py-3">
            <span class="text-sm font-semibold text-ow-ink">{{ PROVIDER_LABEL[c.provider] }}</span>
            <span class="truncate text-[13px] text-ow-muted">{{ c.displayName }}</span>
            <span
              v-if="c.status === 'error'"
              class="rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold"
              style="color: var(--color-error);"
            >{{ c.lastError || 'error' }}</span>
            <span v-else class="text-[12.5px] text-ow-ghost">{{ syncedLabel(c.lastSyncedAt) }}</span>
            <div class="flex-1" />
            <OwButton size="sm" :loading="busy === c.id" @click="syncNow(c.id)">
              {{ busy === c.id ? 'Syncing…' : 'Sync' }}
            </OwButton>
            <button
              type="button"
              class="cursor-pointer border-none bg-transparent px-1 text-[13px]"
              style="color: var(--color-error);"
              @click="cals.disconnect(c.id)"
            >
              Disconnect
            </button>
          </div>

          <div
            v-for="s in c.sources"
            :key="s.id"
            class="flex items-center gap-3 px-3.5 py-2.5"
          >
            <span
              class="h-[9px] w-[9px] flex-none rounded-[3px]"
              :style="{ background: s.enabled ? inkColor(s.color) : 'var(--ow-track)' }"
              aria-hidden="true"
            />
            <input
              v-if="editing === s.id"
              v-model="draftName"
              type="text"
              class="min-w-0 flex-1 rounded-md border bg-ow-surface px-1.5 py-0.5 text-sm outline-none"
              style="border-color: var(--ow-accent-edge);"
              @keydown.enter.prevent="commitEdit(s.id)"
              @keydown.esc.prevent="editing = null"
              @blur="commitEdit(s.id)"
            >
            <span
              v-else
              class="min-w-0 flex-1 truncate text-sm"
              :class="s.enabled ? 'text-ow-ink' : 'text-ow-muted'"
            >{{ s.name }}</span>

            <span class="whitespace-nowrap text-[12.5px] text-ow-muted">
              {{ s.eventCount }} {{ s.eventCount === 1 ? 'event' : 'events' }} this week
            </span>

            <div class="flex gap-1">
              <button
                v-for="ink in HIGHLIGHT_INKS"
                :key="ink"
                type="button"
                :title="INK_LABELS[ink]"
                :aria-label="`${INK_LABELS[ink]} for ${s.name}`"
                :aria-pressed="s.color === ink"
                class="h-4 w-4 cursor-pointer rounded border-none"
                :style="{
                  background: `var(--ow-hl-${ink})`,
                  boxShadow: s.color === ink ? '0 0 0 2px var(--ow-surface), 0 0 0 3px var(--ow-ink)' : 'none',
                }"
                @click="cals.patchSource(s.id, { color: ink })"
              />
            </div>

            <button
              type="button"
              class="cursor-pointer border-none bg-transparent text-[12.5px] text-ow-muted transition-colors hover:text-ow-ink"
              @click="startEdit(s.id, s.name)"
            >
              Rename
            </button>

            <OwSwitch
              :model-value="s.enabled"
              :label="`Show ${s.name}`"
              @update:model-value="cals.patchSource(s.id, { enabled: $event })"
            />
          </div>
        </div>
      </div>
    </section>

    <p v-else class="text-sm text-ow-muted">
      No calendars connected. Add one below to mirror Google, CalDAV or an iCal feed — events are
      read-only and nothing is ever written back.
    </p>

    <p v-if="errorMsg" class="text-[13px]" style="color: var(--color-error);">
      {{ errorMsg }}
    </p>

    <section>
      <h3 class="mb-3 text-[11px] font-semibold tracking-[0.06em] text-ow-faint">
        ADD A CONNECTION
      </h3>
      <div class="flex flex-col gap-4">
        <a
          href="/api/calendars/google/start"
          class="self-start rounded-[9px] border border-ow-border px-3 py-2 text-sm text-ow-text no-underline transition-colors hover:bg-ow-sunken hover:text-ow-ink"
        >
          ＋ Add Google account
        </a>

        <div class="flex flex-col gap-2">
          <span class="text-[12.5px] text-ow-muted">Add an iCal URL</span>
          <div class="flex flex-col gap-2 sm:flex-row">
            <input v-model="icalUrl" :class="inputClass" class="flex-1" placeholder="https://…/basic.ics">
            <input v-model="icalName" :class="[inputClass, 'sm:w-44']" placeholder="Name (optional)">
            <OwButton variant="accent" :loading="busy === 'ical'" @click="addIcal">
              {{ busy === 'ical' ? 'Connecting…' : 'Add' }}
            </OwButton>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="cursor-pointer self-start border-none bg-transparent p-0 text-[12.5px] text-ow-muted transition-colors hover:text-ow-ink"
            @click="showCaldav = !showCaldav"
          >
            {{ showCaldav ? '−' : '＋' }} Add CalDAV (Apple · Nextcloud · Fastmail)
          </button>
          <div v-if="showCaldav" class="flex flex-col gap-2">
            <input v-model="caldav.serverUrl" :class="inputClass" placeholder="Server URL (e.g. https://caldav.icloud.com)">
            <input v-model="caldav.username" :class="inputClass" placeholder="Username / email">
            <input v-model="caldav.password" :class="inputClass" type="password" placeholder="App-specific password">
            <OwButton variant="accent" class="self-start" :loading="busy === 'caldav'" @click="addCaldav">
              {{ busy === 'caldav' ? 'Connecting…' : 'Connect' }}
            </OwButton>
          </div>
        </div>
      </div>
      <p class="mt-4 max-w-[620px] text-[13px] leading-relaxed text-ow-muted">
        Several accounts of the same kind are fine — every event on the week names the calendar it
        came from, and each calendar can be renamed, recoloured, or switched off.
      </p>
    </section>
  </div>
</template>
