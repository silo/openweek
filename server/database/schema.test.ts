import { createSelectSchema } from 'drizzle-zod'
import { describe, expect, it } from 'vitest'
import { userSettings } from './schema/app'

// Version-coupling guard: a zod4 / drizzle-zod split surfaces here (see docs/tech-stack.md).
describe('drizzle-zod contract', () => {
  it('derives a schema for user_settings and parses a sample row', () => {
    const schema = createSelectSchema(userSettings)
    const row = {
      userId: 'user_1',
      weekStartsOn: 1,
      theme: 'system' as const,
      accentColor: '#CBDDE9',
      fontStyle: 'plex-mono' as const,
      tagStyle: 'underline' as const,
      showCalendarEvents: true,
      rolloverEnabled: false,
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(() => schema.parse(row)).not.toThrow()
  })
})
