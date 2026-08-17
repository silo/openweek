export interface GoogleCreds { accessToken: string, refreshToken: string, expiryDate: number, scope?: string }
export interface CalDavCreds { serverUrl: string, username: string, password: string }
export interface IcalCreds { url: string }
export type ProviderCreds = GoogleCreds | CalDavCreds | IcalCreds

/** A single concrete occurrence, provider-agnostic, ready to cache. */
export interface ParsedEvent {
  uid: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  /** For all-day events, the floating YYYY-MM-DD (tz-independent); null for timed events. */
  dateOnly: string | null
  status: 'confirmed' | 'cancelled'
}

export interface RemoteCalendar { id: string, name: string, color: string }
