import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function pickAllowedOrigin(origin: string): string | '' {
  try {
    const u = new URL(origin)
    const host = u.host.toLowerCase()
    if (host === 'hoa.moe' || host === 'prev.hoa.moe') return `${u.protocol}//${host}`
    if (host.endsWith('.hoa.moe')) return `${u.protocol}//${host}`
    return ''
  } catch {
    return ''
  }
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request
  const origin = request.headers.get('origin') || ''
  const allowOrigin = pickAllowedOrigin(origin)

  // Handle CORS preflight early and generically
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })
    res.headers.set('access-control-expose-headers', '*')
    res.headers.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS')
    res.headers.set('access-control-max-age', '1728000')
    res.headers.set('vary', 'origin')
    if (allowOrigin) res.headers.set('access-control-allow-origin', allowOrigin)
    const acrh = request.headers.get('access-control-request-headers')
    if (acrh) res.headers.set('access-control-allow-headers', acrh)
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return res
  }
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
  res.headers.set('access-control-expose-headers', '*')
  res.headers.set('vary', 'origin')
  if (allowOrigin) res.headers.set('access-control-allow-origin', allowOrigin)
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  return res
}

export const config = {
  matcher: ['/', '/((?!_next/|favicon|assets).*)'],
}
