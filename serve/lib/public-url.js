/** Rewrite baked localhost URLs to the host the user actually opened. */
export function lanAwareUrl(raw, { keepTrailingSlash = false } = {}) {
  if (!raw) return raw
  if (typeof window === 'undefined') return raw
  try {
    const u = new URL(raw, window.location.origin)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      u.hostname = window.location.hostname
    }
    const out = u.toString()
    if (keepTrailingSlash) {
      return out.endsWith('/') ? out : `${out}/`
    }
    return out.replace(/\/$/, '')
  } catch {
    return raw
  }
}

/**
 * Prefer same-origin /api via gateway (:80).
 * On :3000/:7001 etc, always hit this host's API on 8081 (Windows host map).
 */
export function getApiBase(baked) {
  const fallback = baked || 'http://localhost:8081/api/v1'
  if (typeof window === 'undefined') return fallback.replace(/\/$/, '')

  const port = window.location.port
  if (port === '' || port === '80' || port === '443') {
    return `${window.location.origin}/api/v1`
  }

  return `${window.location.protocol}//${window.location.hostname}:8081/api/v1`
}
