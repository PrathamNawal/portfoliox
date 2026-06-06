import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './lib/stack'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'portfoliox.me'

const AUTH_REQUIRED = ['/dashboard', '/case-study', '/analytics', '/preview', '/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // ── Subdomain routing ──────────────────────────────────────────────
  // {slug}.portfoliox.me → rewrite to /[slug]
  const isSubdomain =
    host.endsWith(`.${APP_DOMAIN}`) &&
    !host.startsWith('www.') &&
    host !== APP_DOMAIN

  if (isSubdomain) {
    const slug = host.replace(`.${APP_DOMAIN}`, '')
    const url = request.nextUrl.clone()
    url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // ── Auth guard ─────────────────────────────────────────────────────
  const needsAuth = AUTH_REQUIRED.some((r) => pathname.startsWith(r))
  if (!needsAuth) return NextResponse.next()

  const user = await stackServerApp.getUser({ or: 'return-null' })
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('after', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
