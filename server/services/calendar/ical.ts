// Public iCal (.ics) feeds — conditional GET with ETag / If-Modified-Since.
export interface IcalFetchResult {
  status: 'ok' | 'not-modified'
  ics?: string
  etag?: string
  lastModified?: string
}

export async function fetchIcal(url: string, etag?: string, lastModified?: string): Promise<IcalFetchResult> {
  const headers: Record<string, string> = {}
  if (etag) headers['If-None-Match'] = etag
  if (lastModified) headers['If-Modified-Since'] = lastModified

  const res = await fetch(url, { headers, redirect: 'follow' })
  if (res.status === 304) return { status: 'not-modified' }
  if (!res.ok) throw new Error(`iCal fetch failed (${res.status}) for ${url}`)

  return {
    status: 'ok',
    ics: await res.text(),
    etag: res.headers.get('etag') ?? undefined,
    lastModified: res.headers.get('last-modified') ?? undefined,
  }
}
