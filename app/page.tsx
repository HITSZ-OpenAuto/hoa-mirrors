"use client"
import React from 'react'
import { Shuffle, CornerDownLeft, Copy as CopyIcon, Check as CheckIcon } from 'lucide-react'

export default function Page() {
  const [url, setUrl] = React.useState('')
  const [converted, setConverted] = React.useState<string>('')
  const [copied, setCopied] = React.useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url) return
    const normalized = normalizeUrl(url)
    if (normalized !== url) setUrl(normalized)
    const u = new URL(window.location.href)
    u.searchParams.set('q', normalized)
    window.location.href = u.toString()
  }

  function normalizeUrl(input: string) {
    let s = input.trim()
    if (!s) return ''
    // ensure protocol
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s
    // collapse any extra slashes after protocol
    s = s.replace(/^https?:\/+/, 'https://')
    try {
      // Normalize host casing and remove default ports, etc.
      const u = new URL(s)
      u.protocol = 'https:' // prefer https
      // remove trailing spaces in pathname
      u.pathname = u.pathname.replace(/\s+/g, '%20')
      return u.toString()
    } catch {
      return s
    }
  }

  function buildProxiedUrl(input: string) {
    const s = normalizeUrl(input)
    if (!s) return ''
    const base = window.location.origin
    return base + '/?q=' + encodeURIComponent(s)
  }

  function onConvert() {
    const proxied = buildProxiedUrl(url)
    setConverted(proxied)
    setCopied(false)
  }

  async function onCopy() {
    if (!converted) return
    try {
      await navigator.clipboard.writeText(converted)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  return (
    <div className="container">
      <main>
        <div className="card center">
          <h1 className="title">HITSZ OpenAuto 文件加速</h1>
          <form onSubmit={onSubmit} className="row">
            <div className="input-wrap">
              <input
                type="url"
                placeholder="Paste a GitHub URL (blob/raw/releases/asset)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => setUrl((v) => normalizeUrl(v))}
                spellCheck={false}
                required
              />
              <span className="adorn" aria-hidden>
                <CornerDownLeft size={16} />
              </span>
            </div>
            <button
              type="button"
              className="secondary icon-btn"
              onClick={onConvert}
              aria-label="Convert"
              title="Convert"
            >
              <Shuffle size={20} aria-hidden />
            </button>
          </form>
          
          {converted && (
            <div className="result" role="region" aria-live="polite">
              <div className="row" style={{marginTop:8}}>
                <div className="input-wrap">
                  <input type="url" readOnly value={converted} aria-label="Converted link" />
                  <button
                    type="button"
                    className="adorn-btn"
                    onClick={onCopy}
                    aria-label={copied ? 'Copied' : 'Copy'}
                    title={copied ? 'Copied' : 'Copy'}
                  >
                    {copied ? <CheckIcon size={16} aria-hidden /> : <CopyIcon size={16} aria-hidden />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
