import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
  ],

  // Self-hosted fonts (no Google Fonts CDN) + the paper theme entry.
  css: [
    '@fontsource/inter/400.css',
    '@fontsource/inter/500.css',
    '@fontsource/inter/600.css',
    '@fontsource/caveat/400.css',
    '@fontsource/caveat/700.css',
    '~/assets/css/main.css',
  ],

  vite: {
    // Tailwind v4 is CSS-first; wired as a Vite plugin (not @nuxtjs/tailwindcss).
    plugins: [tailwindcss()],
  },

  typescript: {
    // Strict is on by default; build-time type-checking stays off — `pnpm typecheck`
    // (nuxt typecheck → vue-tsc) is the blocking CI gate instead.
    strict: true,
  },
})
