import type { SessionUser } from '~/composables/useAuth'

const PUBLIC_ROUTES = ['/login', '/register']

/**
 * Resolves the session once per navigation (SSR-hydrated via forwarded cookies)
 * and guards routes: unauthenticated → /login, authenticated-on-public → /,
 * non-admin on /admin → /. The server still re-checks every API call.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const userState = useAuthUser()

  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const data = await $fetch<{ user: SessionUser } | null>('/api/auth/get-session', { headers })
    .catch(() => null)
  userState.value = data?.user ?? null

  const isPublic = PUBLIC_ROUTES.includes(to.path)
  const isAdminRoute = to.path.startsWith('/admin')

  if (!userState.value && !isPublic)
    return navigateTo('/login')

  if (userState.value && isPublic)
    return navigateTo('/')

  if (isAdminRoute && userState.value?.role !== 'admin')
    return navigateTo('/')
})
