import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

function getFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  return { auth: getAuth(app), googleProvider: new GoogleAuthProvider() }
}

export function getFirebaseAuth() { return getFirebase().auth }
export function getGoogleProvider() { return getFirebase().googleProvider }
