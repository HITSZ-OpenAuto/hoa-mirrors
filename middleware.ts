import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { nextUrl } = request
  // Only handle root with ?q=
  if (nextUrl.pathname === '/') {
    const q = nextUrl.searchParams.get('q')
    if (q) {
      // Redirect to /<q>
      const to = new URL('/' + q, nextUrl)
      // Ensure https prefix is not lost
      const res = NextResponse.redirect(to)
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
      return res
    }
  }
  const res = NextResponse.next()
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  return res
}

export const config = {
  matcher: ['/', '/((?!_next/|favicon|assets).*)'],
}
