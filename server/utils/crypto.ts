import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import process from 'node:process'

/**
 * AES-256-GCM encryption for provider secrets at rest (refresh tokens, CalDAV
 * passwords, iCal URLs). No dependency — node:crypto only. See docs/calendar-sync.md.
 *
 * - Key: 32 raw bytes from OPENWEEK_ENCRYPTION_KEY (base64, validated at boot).
 * - Fresh random 12-byte IV per record (never reused with the same key).
 * - encKeyVersion + a {version: key} map enables rotation: old rows decrypt with
 *   the old key while new writes use the current key.
 */
const ALGO = 'aes-256-gcm'
const CURRENT_VERSION = 1

export interface Encrypted {
  cipher: string // base64
  iv: string // base64
  authTag: string // base64
  encKeyVersion: number
}

function keyForVersion(version: number): Buffer {
  // Future key versions are added here as a {version: envVar} map.
  if (version === CURRENT_VERSION) {
    const b64 = process.env.OPENWEEK_ENCRYPTION_KEY
    if (!b64)
      throw new Error('OPENWEEK_ENCRYPTION_KEY is not set')
    const key = Buffer.from(b64, 'base64')
    if (key.length !== 32)
      throw new Error('OPENWEEK_ENCRYPTION_KEY must decode to 32 bytes')
    return key
  }
  throw new Error(`No encryption key registered for version ${version}`)
}

export function encrypt(plaintext: string): Encrypted {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, keyForVersion(CURRENT_VERSION), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    cipher: enc.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    encKeyVersion: CURRENT_VERSION,
  }
}

export function decrypt(e: Encrypted): string {
  const decipher = createDecipheriv(ALGO, keyForVersion(e.encKeyVersion), Buffer.from(e.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(e.authTag, 'base64'))
  const dec = Buffer.concat([decipher.update(Buffer.from(e.cipher, 'base64')), decipher.final()])
  return dec.toString('utf8')
}
