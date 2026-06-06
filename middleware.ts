import { NextRequest, NextResponse } from 'next/server'

const AUTH_REQUIRED = ['/dashboard', '/case-study', '/analytics', '/preview', '/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const needsAuth = AUTH_REQUIRED.some((r) => pathname.startsWith(r))

  if (needsAuth && !request.cookies.get('px_session')) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
