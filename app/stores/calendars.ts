import { defineStore } from 'pinia'
import type { CalendarConnectionDto, CalendarEventDto, CalendarProvidersDto, CalendarSourceDto } from '~~/shared/schemas/calendar'

export const useCalendarsStore = defineStore('calendars', () => {
  const connections = ref<CalendarConnectionDto[]>([])
  const loaded = ref(false)
  /** Null until asked — only the Calendars settings pane needs it, so it loads on demand. */
  const providers = ref<CalendarProvidersDto | null>(null)

  /** Every calendar across every connection, in menu order. */
  const sources = computed(() => connections.value.flatMap(c => c.sources))
  const shownCount = computed(() => sources.value.filter(s => s.enabled).length)
  const totalCount = computed(() => sources.value.length)
  const allShown = computed(() => totalCount.value > 0 && shownCount.value === totalCount.value)
  const none = computed(() => totalCount.value === 0)

  /** Ids of calendars currently switched off, for filtering the week without a refetch. */
  const hiddenSourceIds = computed(() => new Set(sources.value.filter(s => !s.enabled).map(s => s.id)))

  /**
   * Every visibility rule in one place — the master "show events" setting, each calendar's
   * own switch, and hiding events that already became tasks. Applied client-side so they
   * take effect without a refetch; every surface that renders events goes through here so
   * they cannot disagree.
   */
  function visibleEvents(events: CalendarEventDto[]): CalendarEventDto[] {
    const settings = useSettingsStore()
    if (settings.settings?.showCalendarEvents === false) return []
    const hideConverted = settings.settings?.hideConvertedEvents ?? true
    if (!hiddenSourceIds.value.size && !hideConverted) return events
    return events.filter(e =>
      !hiddenSourceIds.value.has(e.sourceId) && !(hideConverted && e.converted),
    )
  }

  /** The account line under a calendar's name — whichever identifier the connection carries. */
  function accountFor(source: CalendarSourceDto): string {
    return connections.value.find(c => c.id === source.connectionId)?.displayName ?? ''
  }
  function providerFor(source: CalendarSourceDto) {
    return connections.value.find(c => c.id === source.connectionId)?.provider ?? 'ical'
  }

  async function load(weekStart?: string) {
    const qs = weekStart ? `?start=${weekStart}` : ''
    connections.value = await apiFetch<CalendarConnectionDto[]>(`/api/calendars${qs}`)
    loaded.value = true
  }

  /** Whether this server can run the Google OAuth flow at all — see providers.get.ts. */
  async function loadProviders() {
    providers.value = await apiFetch<CalendarProvidersDto>('/api/calendars/providers')
  }

  async function patchSource(id: string, patch: Partial<Pick<CalendarSourceDto, 'name' | 'color' | 'enabled'>>) {
    const s = sources.value.find(x => x.id === id)
    if (!s) return
    const snapshot = { name: s.name, color: s.color, enabled: s.enabled }
    Object.assign(s, patch)
    try {
      await apiFetch(`/api/calendars/sources/${id}`, { method: 'PATCH', body: patch })
    }
    catch (err) {
      Object.assign(s, snapshot)
      throw err
    }
  }

  function toggle(id: string) {
    const s = sources.value.find(x => x.id === id)
    if (s) return patchSource(id, { enabled: !s.enabled })
  }

  /** Show all, or hide all if everything is already on. */
  async function toggleAll() {
    const next = !allShown.value
    await Promise.all(
      sources.value.filter(s => s.enabled !== next).map(s => patchSource(s.id, { enabled: next })),
    )
  }

  async function disconnect(connectionId: string) {
    const i = connections.value.findIndex(c => c.id === connectionId)
    if (i < 0) return
    const [removed] = connections.value.splice(i, 1)
    try {
      await apiFetch(`/api/calendars/${connectionId}`, { method: 'DELETE' })
    }
    catch (err) {
      if (removed) connections.value.splice(i, 0, removed)
      throw err
    }
  }

  return {
    connections, loaded, providers, sources, shownCount, totalCount, allShown, none, hiddenSourceIds,
    visibleEvents, accountFor, providerFor, load, loadProviders, patchSource, toggle, toggleAll, disconnect,
  }
})
