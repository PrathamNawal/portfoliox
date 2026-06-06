import { redirect } from 'next/navigation'

// Firebase uses a popup — no OAuth callback page needed.
export default function AuthCallback() {
  redirect('/dashboard')
}
