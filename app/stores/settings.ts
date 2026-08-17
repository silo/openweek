import { defineStore } from 'pinia'
import type { Settings, SettingsUpdate } from '~~/shared/schemas/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings | null>(null)

  async function load() {
    settings.value = await apiFetch<Settings | null>('/api/me/settings')
  }

  async function update(patch: SettingsUpdate) {
    const previous = settings.value
    if (settings.value) settings.value = { ...settings.value, ...patch } // optimistic
    try {
      settings.value = await apiFetch<Settings>('/api/me/settings', { method: 'PATCH', body: patch })
    }
    catch (err) {
      settings.value = previous // rollback
      throw err
    }
  }

  return { settings, load, update }
})
