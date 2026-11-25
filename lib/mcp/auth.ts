// Personal access tokens, confirmation tokens and secret encryption for the MCP server.
import crypto from 'crypto'

export const TOKEN_PREFIX = 'pxm_'

export function generateToken(): { token: string; hash: string } {
  const token = TOKEN_PREFIX + crypto.randomBytes(24).toString('base64url')
  return { token, hash: hashToken(token) }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function bearerToken(header: string | null): string | null {
  const m = header?.match(/^Bearer\s+(\S+)$/i)
  return m && m[1].startsWith(TOKEN_PREFIX) ? m[1] : null
}

function secret(): Buffer {
  const raw = process.env.MCP_ENCRYPTION_KEY
  if (!raw) throw new Error('MCP_ENCRYPTION_KEY is not set')
  // Accept any string; derive a fixed 32-byte key from it.
  return crypto.createHash('sha256').update(raw).digest()
}

/** AES-256-GCM. Output: iv.tag.ciphertext, all base64url. */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', secret(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), enc].map(b => b.toString('base64url')).join('.')
}

export function decryptSecret(blob: string): string {
  const [iv, tag, enc] = blob.split('.').map(s => Buffer.from(s, 'base64url'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', secret(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

/**
 * Two-step confirmation for actions that change the live portfolio. The first call returns a token bound to
 * the user, the action and the target; only a second call carrying it acts. Tokens expire after 10 minutes.
 */
export function makeConfirmToken(userId: string, action: string, target: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + 600
  const sig = crypto.createHmac('sha256', secret()).update(`${userId}:${action}:${target}:${exp}`).digest('base64url').slice(0, 32)
  return `${exp}.${sig}`
}

export function checkConfirmToken(token: string | undefined, userId: string, action: string, target: string, now = Date.now()): boolean {
  if (!token) return false
  const [expStr, sig] = token.split('.')
  const exp = Number(expStr)
  if (!exp || !sig || exp < Math.floor(now / 1000)) return false
  const want = crypto.createHmac('sha256', secret()).update(`${userId}:${action}:${target}:${exp}`).digest('base64url').slice(0, 32)
  return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))
}
