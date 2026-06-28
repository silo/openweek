import { defineVitestConfig } from '@nuxt/test-utils/config'

// Default environment is Node (fast pure-logic tests). Files that need the Nuxt
// runtime (composables, the Pinia store) opt in with `// @vitest-environment nuxt`.
export default defineVitestConfig({
  test: {
    environment: 'node',
    include: ['{app,server,shared}/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'shared/utils/**/*.ts',
        'shared/schemas/**/*.ts',
        'server/utils/first-user.ts',
        'server/utils/rollover.ts',
        'server/utils/runtime-config.ts',
        'server/utils/crypto.ts',
        'server/utils/sync-cursor.ts',
        'server/utils/event-expansion.ts',
        'app/stores/**/*.ts',
      ],
      exclude: ['**/*.test.ts'],
    },
  },
})
