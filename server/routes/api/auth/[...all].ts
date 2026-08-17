import { auth } from '../../../utils/auth'

// Mounts every Better Auth route (sign-in/up/out, session, social, admin) at /api/auth/**.
// Lives under server/routes/ (not server/api/) so the `**` catch-all stays out of the typed
// $fetch route map — otherwise it triggers a TS "excessive stack depth" error.
export default defineEventHandler(event => auth.handler(toWebRequest(event)))
