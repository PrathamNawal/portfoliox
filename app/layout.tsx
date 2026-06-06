import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PortfolioX — Visual Portfolio Builder for Designers',
  description: 'Upload your work. We wrap the words around it.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-variation="vermillion">
      <body>
        {children}
      </body>
    </html>
  )
}
