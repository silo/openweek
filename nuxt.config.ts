import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
  ],

  // Register components by filename (no directory prefix): <DayColumn>, <TaskRow>,
  // <Toaster>, … rather than <WeekDayColumn>, <UiToaster>.
  components: [{ path: '~/components', pathPrefix: false }],

  // Self-hosted fonts (no Google Fonts CDN) + the paper theme entry.
  // v2: IBM Plex Mono (display) + IBM Plex Sans (body).
  css: [
    '@fontsource/ibm-plex-sans/400.css',
    '@fontsource/ibm-plex-sans/500.css',
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
    '@fontsource/ibm-plex-mono/600.css',
    '~/assets/css/main.css',
  ],

  // Calendar sync runs as an in-process Nitro scheduled task (polling, not push).
  nitro: {
    experimental: { tasks: true },
    scheduledTasks: { '*/10 * * * *': ['sync'] },
  },

  vite: {
    // Tailwind v4 is CSS-first; wired as a Vite plugin (not @nuxtjs/tailwindcss).
    plugins: [tailwindcss()],
    // Pre-bundle the auth client deps so the first sign-in doesn't trigger a
    // dep-optimization page reload mid-request.
    optimizeDeps: {
      include: ['better-auth/vue', 'better-auth/client/plugins'],
    },
  },

  typescript: {
    // Strict is on by default; build-time type-checking stays off — `pnpm typecheck`
    // (nuxt typecheck → vue-tsc) is the blocking CI gate instead.
    strict: true,
  },
})
