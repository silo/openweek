// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Nuxt defaults to server sourcemaps in production. Nobody attaches a debugger to a
  // self-hosted Nitro bundle, and generating them costs ~130 MB of build heap: with them on
  // the build needs ~600 MB, which is more than the ~520 MB ceiling Node gives itself inside
  // a 1 GB container, so `docker compose up --build` died with an unexplained exit 1 on small
  // hosts. Off, it builds in 1 GB. Dev is unaffected — this only applies to `nuxt build`.
  sourcemap: false,
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  // Components keep their own names regardless of subdirectory, so the primitives in
  // components/ui are <OwButton> rather than <UiOwButton>.
  components: [{ path: '~/components', pathPrefix: false }],
  css: [
    // Self-hosted fonts (no CDN) — the design canvases link Google Fonts, which we deliberately
    // do not copy. Weights are the 400/500/600 the design actually renders; see docs/design.md.
    // Display face — variable, covers the whole 400..600 range in one file.
    '@fontsource-variable/bricolage-grotesque/wght.css',
    // Body faces — user-selectable via the Typeface setting (see app/composables/useTheme.ts).
    '@fontsource/open-sans/400.css',
    '@fontsource/open-sans/500.css',
    '@fontsource/open-sans/600.css',
    '@fontsource/lato/400.css',
    '@fontsource/lato/700.css', // Lato ships no 500/600
    '@fontsource/roboto/400.css',
    '@fontsource/roboto/500.css',
    '@fontsource/roboto/700.css',
    '@fontsource/inter/400.css',
    '@fontsource/inter/500.css',
    '@fontsource/inter/600.css',
    '@fontsource/source-sans-3/400.css',
    '@fontsource/source-sans-3/500.css',
    '@fontsource/source-sans-3/600.css',
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
      // data-theme / data-accent are set in app.vue from the user's settings.
      htmlAttrs: { lang: 'en' },
      title: 'Openweek',
    },
  },
})
