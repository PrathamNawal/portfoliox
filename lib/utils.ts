import crypto from 'crypto'

export const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'blog', 'help', 'support',
  'dashboard', 'signin', 'signup', 'logout', 'onboarding',
  'case-study', 'preview', 'analytics',
])

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug) && !RESERVED_SLUGS.has(slug)
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function hashInputs(...parts: string[]): string {
  return crypto
    .createHash('sha256')
    .update(parts.join('||'))
    .digest('hex')
}

export function anonymousFingerprint(ip: string, ua: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return crypto
    .createHash('sha256')
    .update(`${ip}||${ua}||${today}`)
    .digest('hex')
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + '…'
}

export const FILLER_OPENERS = [
  "i'm thrilled to share",
  "in this case study",
  "this is an exciting project",
  "i am excited to",
  "welcome to this case study",
  "in this project",
]

export function hasFillOpener(text: string): boolean {
  const lower = text.toLowerCase().trimStart()
  return FILLER_OPENERS.some((f) => lower.startsWith(f))
}
