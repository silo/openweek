import { describe, expect, it } from 'vitest'
import { firstUserRole } from './first-user'

describe('firstUserRole', () => {
  it('makes the first user (zero existing) an admin', () => {
    expect(firstUserRole(0)).toBe('admin')
  })
  it('makes every subsequent user a normal user', () => {
    expect(firstUserRole(1)).toBe('user')
    expect(firstUserRole(42)).toBe('user')
  })
})
