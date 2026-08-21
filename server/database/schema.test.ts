import { createSelectSchema } from 'drizzle-zod'
import { describe, expect, it } from 'vitest'
import { userSettings } from './schema/app'
import { settingsSchema } from '~~/shared/schemas/settings'

// Version-coupling guard: a zod4 / drizzle-zod split surfaces here (see docs/tech-stack.md).
describe('drizzle-zod contract', () => {
  const row = {
    userId: 'user_1',
    weekStartsOn: 1,
    theme: 'system' as const,
    accentColor: 'persimmon' as const,
    fontStyle: 'open-sans' as const,
    tagStyle: 'edge' as const,
    textSize: 'default' as const,
    showWeekends: true,
    showLists: true,
    listsHeight: 0,
    collapseDone: true,
    showWeekStats: true,
    showCalendarEvents: true,
    hideConvertedEvents: true,
    rolloverEnabled: false,
    timezone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('derives a schema for user_settings and parses a sample row', () => {
    const schema = createSelectSchema(userSettings)
    expect(() => schema.parse(row)).not.toThrow()
  })

  it('keeps the table and the shared Zod contract in step', () => {
    // The API returns the row straight from the table, so the hand-written contract in
    // shared/schemas must accept it. Drift here breaks the client's types silently.
    const { userId: _u, createdAt: _c, updatedAt: _up, ...apiShape } = row
    expect(() => settingsSchema.parse(apiShape)).not.toThrow()
  })

  it('rejects colours from the pre-rework palette', () => {
    expect(settingsSchema.safeParse({ ...row, accentColor: '#CBDDE9' }).success).toBe(false)
  })
})
