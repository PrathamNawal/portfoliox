// Pure helpers for "capture a screen from a page URL" (app/api/screenshot).

const MAX_URL = 2000

/** Only public http(s) pages. No credentials, no IP literals, no local or internal names. */
export function checkCaptureUrl(raw: unknown): { url: string } | { error: string } {
  if (typeof raw !== 'string' || !raw.trim() || raw.length > MAX_URL) return { error: 'Enter a page URL' }
  let u: URL
  try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`) } catch { return { error: 'That does not look like a URL' } }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'Only http or https pages' }
  if (u.username || u.password) return { error: 'The URL cannot contain a login' }
  if (u.port && u.port !== '80' && u.port !== '443') return { error: 'Only standard ports' }
  const host = u.hostname.toLowerCase().replace(/\.$/, '')
  if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || host.startsWith('[')) return { error: 'Use a public website address' }
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|test|invalid|example)$/.test(host)) return { error: 'Use a public website address' }
  return { url: u.toString() }
}

/** Providers' image hosts we are willing to download from (guards against redirects to anywhere else). */
export function isProviderImageHost(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (u.hostname === 'image.thum.io' || u.hostname === 'microlink.io' || u.hostname.endsWith('.microlink.io'))
  } catch { return false }
}

/** Width and height from a PNG header, or null if the bytes are not a PNG. */
export function pngSize(buf: Uint8Array): { w: number; h: number } | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (buf.length < 24 || sig.some((b, i) => buf[i] !== b)) return null
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const w = dv.getUint32(16), h = dv.getUint32(20)
  return w > 0 && h > 0 && w <= 10000 && h <= 10000 ? { w, h } : null
}
