import { Buffer } from 'node:buffer'
import { beforeAll, describe, expect, it } from 'vitest'

let encryptJson: typeof import('./crypto').encryptJson
let decryptJson: typeof import('./crypto').decryptJson

beforeAll(async () => {
  process.env.OPENWEEK_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64')
  const mod = await import('./crypto')
  encryptJson = mod.encryptJson
  decryptJson = mod.decryptJson
})

describe('crypto (AES-256-GCM)', () => {
  it('round-trips a JSON value', () => {
    const secret = { url: 'https://example.com/feed.ics', token: 'abc123' }
    const enc = encryptJson(secret)
    expect(enc.ciphertext).not.toContain('example.com')
    expect(decryptJson(enc)).toEqual(secret)
  })

  it('fails to decrypt when the auth tag is wrong', () => {
    const enc = encryptJson({ a: 1 })
    const tampered = { ...enc, authTag: Buffer.alloc(16, 0).toString('base64') }
    expect(() => decryptJson(tampered)).toThrow()
  })

  it('fails to decrypt with the wrong key', () => {
    const enc = encryptJson({ a: 1 })
    process.env.OPENWEEK_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64')
    expect(() => decryptJson(enc)).toThrow()
    process.env.OPENWEEK_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64')
  })
})
