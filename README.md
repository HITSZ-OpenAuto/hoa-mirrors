HITSZ OpenAuto FastDL

Overview
- Proxy for GitHub raw/blob/releases/assets.
- Built with Next.js App Router using Route Handlers and Middleware.

Scripts
- `npm run dev` — start dev server
- `npm run build` — build
- `npm run start` — run production

Usage
1) Start dev: `npm run dev`
2) Open http://localhost:3000
3) Paste a GitHub URL (blob/raw/releases/asset) and click Go.
4) The app redirects to `/<URL>` and serves proxied content with proper headers.

Proxy behavior (ported)
- Rewrites `blob` to `raw` (unless jsDelivr redirect is enabled in code).
- Follows redirects; if upstream `Location` points to GitHub URLs, re-prefixes through this proxy.
- Sets `access-control-allow-origin: *` and `access-control-expose-headers: *`.
- Strips CSP-related headers.
- Handles CORS preflight (OPTIONS) with 204 status.

Whitelist
- Adjust `whiteList` inside `app/[...proxy]/route.ts` to control allowed URLs.

Notes
- Built for Node 18+ runtime; Route Handlers run on the Edge runtime.
- UI intentionally minimal and not dependent on the original asset frontend.
