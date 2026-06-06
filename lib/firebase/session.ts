import { cookies } from 'next/headers'

export interface FirebaseUser {
  uid: string
  email: string
  name: string
}

export async function getSessionUser(): Promise<FirebaseUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('px_session')?.value
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as FirebaseUser
  } catch {
    return null
  }
}
