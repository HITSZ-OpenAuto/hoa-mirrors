import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PREFIX = '/'
const Config = { jsdelivr: 0 }
// Only allow URLs that include the following substrings. Non-empty means restrictive.
const whiteList: string[] = ['/HITSZ-OpenAuto/']

const exp1 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i
const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob|raw)\/.*$/i
const exp3 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i
const exp4 = /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+$/i
const exp5 = /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i
const exp6 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i

function checkUrl(u: string) {
  for (const r of [exp1, exp2, exp3, exp4, exp5, exp6]) {
    if (u.search(r) === 0) return true
  }
  return false
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = pickAllowedOrigin(origin)
  const headers: Record<string, string> = {
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
    'access-control-max-age': '1728000',
    'vary': 'origin',
  }
  if (allowOrigin) headers['access-control-allow-origin'] = allowOrigin
  if (req.headers.has('access-control-request-headers')) {
    const acrh = req.headers.get('access-control-request-headers')!
    headers['access-control-allow-headers'] = acrh
  }
  return new Response(null, { status: 204, headers })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(req, ctx)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(req, ctx)
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(req, ctx)
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(req, ctx)
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(req, ctx)
}
export async function HEAD(req: NextRequest, ctx: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(req, ctx)
}

async function handleProxy(req: NextRequest, ctx: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await ctx.params
  let pathPart = (proxy || []).join('/')
  // worker normalized // to /
  pathPart = pathPart.replace(/^https?:\/+/, 'https://')

  if (
    pathPart.search(exp1) === 0 ||
    pathPart.search(exp5) === 0 ||
    pathPart.search(exp6) === 0 ||
    pathPart.search(exp3) === 0
  ) {
    return httpHandler(req, pathPart)
  } else if (pathPart.search(exp2) === 0) {
    if (Config.jsdelivr) {
      const newUrl = pathPart
        .replace('/blob/', '@')
        .replace(/^(?:https?:\/\/)?github\.com/, 'https://cdn.jsdelivr.net/gh')
      return Response.redirect(newUrl, 302)
    } else {
      pathPart = pathPart.replace('/blob/', '/raw/')
      return httpHandler(req, pathPart)
    }
  } else if (pathPart.search(exp4) === 0) {
    if (Config.jsdelivr) {
      const newUrl = pathPart
        .replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, '@$1')
        .replace(/^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com/, 'https://cdn.jsdelivr.net/gh')
      return Response.redirect(newUrl, 302)
    } else {
      return httpHandler(req, pathPart)
    }
  }

  return new Response('Not found', { status: 404 })
}

async function httpHandler(req: NextRequest, pathname: string) {
  // Clone and modify headers
  const reqHdr = new Headers(req.headers)
  reqHdr.set('accept-language', 'en')

  let urlStr = pathname
  let allowed = whiteList.length === 0
  for (const i of whiteList) {
    if (urlStr.includes(i)) { allowed = true; break }
  }
  if (!allowed) {
    return new Response('blocked', { status: 403 })
  }
  if (urlStr.search(/^https?:\/\//) !== 0) {
    urlStr = 'https://' + urlStr
  }

  const reqInit: RequestInit = {
    method: req.method,
    headers: reqHdr,
    redirect: 'manual',
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (await req.blob()),
  }
  return proxy(req, new URL(urlStr), reqInit)
}

function pickAllowedOrigin(origin: string): string | '' {
  // Allow hoa.moe, prev.hoa.moe, and any *.hoa.moe
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

async function proxy(req: NextRequest, urlObj: URL, reqInit: RequestInit): Promise<Response> {
  const res = await fetch(urlObj.href, reqInit)
  const resHdrNew = new Headers(res.headers)
  const origin = req.headers.get('origin') || ''
  const allowOrigin = pickAllowedOrigin(origin)

  if (resHdrNew.has('location')) {
    const loc = resHdrNew.get('location') || ''
    if (checkUrl(loc)) {
      resHdrNew.set('location', PREFIX + loc)
    } else {
      // follow external redirect
      const next = safeUrl(loc)
      if (next) {
        return proxy(req, next, { ...reqInit, redirect: 'follow' })
      }
    }
  }

  resHdrNew.set('access-control-expose-headers', '*')
  resHdrNew.set('vary', 'origin')
  if (allowOrigin) {
    resHdrNew.set('access-control-allow-origin', allowOrigin)
  } else {
    resHdrNew.delete('access-control-allow-origin')
  }
  resHdrNew.delete('content-security-policy')
  resHdrNew.delete('content-security-policy-report-only')
  resHdrNew.delete('clear-site-data')

  return new Response(res.body, {
    status: res.status,
    headers: resHdrNew,
  })
}

function safeUrl(u: string): URL | null {
  try { return new URL(u) } catch { return null }
}
