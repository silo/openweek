// Loads the user's settings on both server and client. Loading them during SSR is what
// lets app.vue render the right theme in the initial HTML instead of flashing Paper and
// correcting after hydration.
export default defineNuxtPlugin(async () => {
  const store = useSettingsStore()

  if (!store.settings) {
    try {
      await store.load()
    }
    catch {
      // Unauthenticated (e.g. on /login) — nothing to apply yet.
    }
  }

  if (!import.meta.client) return

  watchEffect(() => {
    if (store.settings) applyTheme(store.settings)
  })

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (store.settings?.theme === 'system') applyTheme(store.settings)
  })
})
