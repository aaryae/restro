/**
 * Rewrite baked localhost URLs to the host the user actually opened.
 * When browsing Serve on localhost/LAN, also rewrite remote POS hosts (e.g.
 * pos.technirvana.com.np) back to local admin so misconfigured API envs
 * cannot bounce local login to production.
 */
export function lanAwareUrl(raw, { keepTrailingSlash = false } = {}) {
  if (!raw) return raw
  if (typeof window === 'undefined') return raw
  try {
    const u = new URL(raw, window.location.origin)
    const browsingLocal = isLocalDevHost(window.location.hostname)

    if (isLocalDevHost(u.hostname)) {
      u.hostname = window.location.hostname
    } else if (browsingLocal) {
      const localPos = localPosOrigin()
      let tenant = u.searchParams.get('tenant')
      if (!tenant) {
        const first = u.hostname.split('.')[0]
        if (first && first !== 'pos' && first !== 'www' && first !== 'admin') {
          tenant = first
        }
      }
      const hash = u.hash
      const tenantParam = tenant || u.searchParams.get('tenant')
      u.protocol = localPos.protocol
      u.hostname = localPos.hostname
      u.port = localPos.port
      u.pathname = '/'
      u.search = ''
      if (tenantParam) u.searchParams.set('tenant', tenantParam)
      u.hash = hash
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

function isLocalDevHost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
  )
}

/** POS admin origin when Serve is opened locally — never trust production bake. */
export function localPosOrigin() {
  const baked = process.env.NEXT_PUBLIC_POS_URL || ''
  if (baked && isLocalDevHost(new URL(baked, 'http://localhost').hostname)) {
    return new URL(baked)
  }
  if (typeof window !== 'undefined') {
    return new URL('http://localhost:7001')
  }
  return new URL('http://localhost:7001')
}

/**
 * Browser always uses same-origin /api/v1 (Next or gateway proxies to backend).
 * Avoids Windows Docker host-port :8081 ERR_EMPTY_RESPONSE / CORS preflight death.
 */
export function getApiBase(baked) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`
  }
  return (baked || 'http://127.0.0.1:8081/api/v1').replace(/\/$/, '')
}
