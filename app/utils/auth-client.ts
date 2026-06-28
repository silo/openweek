import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

/**
 * Browser auth client. Mirrors the server plugins (admin) and the user
 * additionalFields so `signUp`/`updateUser`/`useSession` are typed without
 * importing any server (DB/secret) code into the client bundle.
 */
export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    inferAdditionalFields({
      user: {
        timezone: { type: 'string', required: false, input: true },
        weekStartsOn: { type: 'number', required: false, input: true },
        rolloverEnabled: { type: 'boolean', required: false, input: true },
        lastRolloverDate: { type: 'string', required: false, input: false },
        accentColor: { type: 'string', required: false, input: true },
        tagStyle: { type: 'string', required: false, input: true },
        showCalendarEvents: { type: 'boolean', required: false, input: true },
      },
    }),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
