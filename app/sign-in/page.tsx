import dynamic from 'next/dynamic'

const SignInClient = dynamic(() => import('./SignInClient').then(m => m.SignInClient), { ssr: false })

export default function SignInPage() {
  return <SignInClient />
}
