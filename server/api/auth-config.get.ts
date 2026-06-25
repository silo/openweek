import { getEnv } from '~~/server/utils/runtime-config'

// Public, non-secret flags the login/register pages need (e.g. whether to show
// the Google button). Never expose secrets here.
export default defineEventHandler(() => {
  const env = getEnv()
  return {
    googleEnabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  }
})
