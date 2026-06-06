import type { Metadata } from 'next'
import { Suspense } from 'react'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '@/lib/stack'
import './globals.css'

export const metadata: Metadata = {
  title: 'PortfolioX — Visual Portfolio Builder for Designers',
  description: 'Upload your work. We wrap the words around it.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-variation="vermillion">
      <body>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <Suspense>
              {children}
            </Suspense>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
