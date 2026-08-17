// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  css: [
    // Self-hosted fonts (no CDN). Weights per docs/design.md; extra families power the font switcher.
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
    '@fontsource/ibm-plex-mono/600.css',
    '@fontsource/ibm-plex-mono/400-italic.css',
    '@fontsource/ibm-plex-sans/400.css',
    '@fontsource/ibm-plex-sans/500.css',
    '@fontsource/newsreader/400.css',
    '@fontsource/newsreader/500.css',
    '@fontsource/newsreader/600.css',
    '@fontsource/space-grotesk/400.css',
    '@fontsource/space-grotesk/500.css',
    '@fontsource/space-grotesk/600.css',
    '@fontsource/spline-sans-mono/400.css',
    '@fontsource/spline-sans-mono/500.css',
    '@fontsource/spline-sans-mono/600.css',
    '~/assets/css/main.css',
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    // Scheduled polling: rollover (hourly, catches each tz midnight) and calendar sync (Phase 7).
    experimental: { tasks: true },
    scheduledTasks: {
      '0 * * * *': ['rollover'],
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en', 'data-theme': 'openweek' },
      title: 'Openweek',
    },
  },
})
