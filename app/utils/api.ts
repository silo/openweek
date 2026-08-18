import type { FetchOptions } from 'ofetch'

/** Erased fetcher signature — see the note below on why the types are thrown away. */
type PlainFetch = <T>(url: string, opts?: FetchOptions) => Promise<T>

// Both fetchers are cast to a plain signature before use. Their typed-route generics blow
// past TypeScript's recursion limit in this project ("excessive stack depth"), and for
// useRequestFetch the blow-up is in its own return type, so the cast has to sit on the
// function rather than on the call.
const requestFetch = useRequestFetch as unknown as () => PlainFetch
const plainFetch = $fetch as unknown as PlainFetch

/**
 * Thin typed wrapper over Nuxt's `$fetch`. Response shapes are typed via the explicit
 * generic + the shared Zod contract instead of the route types.
 *
 * On the server it goes through `useRequestFetch`, which forwards the incoming request's
 * cookies. Plain `$fetch` does not, so every SSR call to an app endpoint would 401 and the
 * page would render as though the user had no data.
 */
export function apiFetch<T>(url: string, opts?: FetchOptions): Promise<T> {
  const fetcher = import.meta.server ? requestFetch() : plainFetch
  return fetcher<T>(url, opts)
}
