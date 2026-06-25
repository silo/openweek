import { serverAuth } from '~~/server/utils/auth'

// Mounts every Better Auth endpoint (sign-in/up/out, get-session, OAuth callbacks, admin).
export default defineEventHandler((event) => {
  return serverAuth().handler(toWebRequest(event))
})
