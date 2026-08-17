import type { FetchOptions } from 'ofetch'

/**
 * Thin typed wrapper over Nuxt's `$fetch`. Passing the URL as a plain `string`
 * (not a string literal) sidesteps Nuxt's typed-route scorer, which otherwise hits
 * TypeScript's recursion limit ("excessive stack depth") in this project. Response
 * shapes are typed via the explicit generic + the shared Zod contract instead.
 */
export function apiFetch<T>(url: string, opts?: FetchOptions): Promise<T> {
  return $fetch<T>(url, opts as never) as Promise<T>
}
