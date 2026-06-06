import { StackServerApp } from '@stackframe/stack'

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: {
    signIn: '/sign-in',
    afterSignIn: '/dashboard',
    afterSignUp: '/onboarding',
    afterSignOut: '/',
  },
})
