import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// AES-256-GCM encryption for calendar credentials at rest. Per-record IV + auth tag +
// key version so keys can be rotated. See docs/calendar-sync.md.
const ALGORITHM = 'aes-256-gcm'

function keyFor(version: number): Buffer {
  if (version !== 1) throw new Error(`Unknown encryption key version ${version}`)
  const b64 = process.env.OPENWEEK_ENCRYPTION_KEY
  if (!b64) throw new Error('OPENWEEK_ENCRYPTION_KEY is not set')
  const key = Buffer.from(b64, 'base64')
  if (key.length !== 32) throw new Error('OPENWEEK_ENCRYPTION_KEY must decode to 32 bytes')
  return key
}

export interface Encrypted {
  ciphertext: string
  iv: string
  authTag: string
  keyVersion: number
}

export function encryptJson(value: unknown, keyVersion = 1): Encrypted {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, keyFor(keyVersion), iv)
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    keyVersion,
  }
}

export function decryptJson<T>(enc: Encrypted): T {
  const decipher = createDecipheriv(ALGORITHM, keyFor(enc.keyVersion), Buffer.from(enc.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(enc.authTag, 'base64'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(enc.ciphertext, 'base64')), decipher.final()])
  return JSON.parse(plaintext.toString('utf8')) as T
}
