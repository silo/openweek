import { Buffer } from 'node:buffer'
import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { decrypt, encrypt } from './crypto'

const KEY = Buffer.alloc(32, 7).toString('base64')

beforeAll(() => { process.env.OPENWEEK_ENCRYPTION_KEY = KEY })
afterAll(() => { delete process.env.OPENWEEK_ENCRYPTION_KEY })

describe('crypto (AES-256-GCM)', () => {
  it('round-trips plaintext', () => {
    const secret = 'refresh-token-abc123:/path?x=1'
    expect(decrypt(encrypt(secret))).toBe(secret)
  })

  it('uses a fresh IV each time (ciphertext differs)', () => {
    const a = encrypt('same')
    const b = encrypt('same')
    expect(a.iv).not.toBe(b.iv)
    expect(a.cipher).not.toBe(b.cipher)
    expect(decrypt(a)).toBe('same')
    expect(decrypt(b)).toBe('same')
  })

  it('stamps the current key version', () => {
    expect(encrypt('x').encKeyVersion).toBe(1)
  })

  it('fails on a tampered auth tag', () => {
    const e = encrypt('secret')
    const tampered = { ...e, authTag: Buffer.alloc(16, 0).toString('base64') }
    expect(() => decrypt(tampered)).toThrow()
  })

  it('fails on tampered ciphertext', () => {
    const e = encrypt('secret')
    const flipped = Buffer.from(e.cipher, 'base64')
    flipped[0] = (flipped[0] ?? 0) ^ 0xFF
    expect(() => decrypt({ ...e, cipher: flipped.toString('base64') })).toThrow()
  })

  it('rejects an unknown key version', () => {
    const e = encrypt('secret')
    expect(() => decrypt({ ...e, encKeyVersion: 99 })).toThrow(/version 99/)
  })
})
