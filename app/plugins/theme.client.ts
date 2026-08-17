// Loads the user's settings and keeps the theme (data-theme + accent + fonts) in sync.
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

  watchEffect(() => {
    if (store.settings) applyTheme(store.settings)
  })

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    if (store.settings?.theme === 'system') applyTheme(store.settings)
  })
})
