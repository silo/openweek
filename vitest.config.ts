import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors Nuxt's project-root alias so server/ tests can import the shared contracts
      // the same way the handlers do.
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/.nuxt/**', '**/.output/**', '**/dist/**', '**/e2e/**'],
  },
})
