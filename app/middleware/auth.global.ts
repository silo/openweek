import { authClient } from '~/lib/auth-client'

const AUTH_ROUTES = ['/login', '/register']

export default defineNuxtRouteMiddleware(async (to) => {
  // First run: no users yet → force registration (that user becomes the admin).
  const { data: setup } = await useFetch('/api/setup-state')
  if (setup.value && !setup.value.hasUsers) {
    return to.path === '/register' ? undefined : navigateTo('/register')
  }

  const { data: session } = await authClient.useSession(useFetch)
  const onAuthRoute = AUTH_ROUTES.includes(to.path)

  if (!session.value && !onAuthRoute) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (session.value && onAuthRoute) {
    return navigateTo('/')
  }
})
