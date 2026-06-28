import { describe, expect, it } from 'vitest'
import { connectCaldavInput, connectIcalInput, convertEventInput, updateCalendarInput } from './sync'

const uuid = '019efe4c-f5db-70ea-984a-1f7f3ec8b5e6'

describe('connectIcalInput', () => {
  it('accepts a valid feed', () => {
    expect(connectIcalInput.safeParse({ label: 'Work', url: 'https://example.com/feed.ics' }).success).toBe(true)
  })
  it('rejects a non-URL', () => {
    expect(connectIcalInput.safeParse({ label: 'Work', url: 'not-a-url' }).success).toBe(false)
  })
})

describe('connectCaldavInput', () => {
  it('requires server, username, password', () => {
    expect(connectCaldavInput.safeParse({ label: 'iCloud', serverUrl: 'https://caldav.icloud.com', username: 'a', password: 'b' }).success).toBe(true)
    expect(connectCaldavInput.safeParse({ label: 'iCloud', serverUrl: 'https://caldav.icloud.com', username: 'a' }).success).toBe(false)
  })
})

describe('updateCalendarInput', () => {
  it('accepts enable + board map, rejects empty', () => {
    expect(updateCalendarInput.safeParse({ enabled: false }).success).toBe(true)
    expect(updateCalendarInput.safeParse({ boardId: null }).success).toBe(true)
    expect(updateCalendarInput.safeParse({}).success).toBe(false)
  })
})

describe('convertEventInput', () => {
  it('requires a uuid event id + date, defaults keepLinked true', () => {
    const r = convertEventInput.parse({ syncedEventId: uuid, date: '2026-06-26' })
    expect(r.keepLinked).toBe(true)
  })
  it('rejects a bad date', () => {
    expect(convertEventInput.safeParse({ syncedEventId: uuid, date: '6/26/2026' }).success).toBe(false)
  })
})
