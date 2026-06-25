/**
 * First registered user becomes the admin; everyone after is a normal user.
 * Pure helper so the rule is unit-testable independently of Better Auth + the DB.
 */
export function firstUserRole(existingUserCount: number): 'admin' | 'user' {
  return existingUserCount === 0 ? 'admin' : 'user'
}
