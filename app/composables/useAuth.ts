import type { authClient } from '~/utils/auth-client'

// The session user (incl. our additionalFields), inferred from the auth client.
export type SessionUser = typeof authClient.$Infer.Session.user

/**
 * SSR-shared current user. Populated by the global auth middleware on every
 * navigation; components read it without re-fetching. `null` = signed out.
 */
export function useAuthUser() {
  return useState<SessionUser | null>('auth:user', () => null)
}
