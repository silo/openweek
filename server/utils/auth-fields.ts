import type { BetterAuthOptions } from 'better-auth'

type UserAdditionalFields = NonNullable<NonNullable<BetterAuthOptions['user']>['additionalFields']>

/**
 * Per-user planner settings added to Better Auth's `user` (scalars only; names
 * match server/db/schema/auth.ts). Shared by the runtime config
 * (server/utils/auth.ts) and the schema-generation config (auth.config.ts) so
 * the two never drift. See docs/data-model.md.
 */
export const userAdditionalFields: UserAdditionalFields = {
  timezone: { type: 'string', required: false, defaultValue: 'UTC', input: true },
  weekStartsOn: { type: 'number', required: false, defaultValue: 1, input: true },
  rolloverEnabled: { type: 'boolean', required: false, defaultValue: false, input: true },
  lastRolloverDate: { type: 'string', required: false, input: false },
  // v2 appearance + sync prefs.
  accentColor: { type: 'string', required: false, defaultValue: 'sky', input: true },
  tagStyle: { type: 'string', required: false, defaultValue: 'underline', input: true },
  showCalendarEvents: { type: 'boolean', required: false, defaultValue: true, input: true },
}
