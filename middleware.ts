import { NextRequest, NextResponse } from 'next/server'

// DIAGNOSTIC: middleware auth check disabled — let server layouts handle auth
// This tells us if the issue is the middleware or the exchange itself
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
