import { getApiBase, lanAwareUrl, localPosOrigin } from './public-url'

export function getTrialToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('serve_trial_token')
}

export function setTrialSession(data) {
  if (typeof window === 'undefined') return
  localStorage.setItem('serve_trial_token', data.token)
  localStorage.setItem('serve_trial_user', JSON.stringify(data))
}

export function getTrialUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('serve_trial_user') || 'null')
  } catch {
    return null
  }
}

export function clearTrialSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('serve_trial_token')
  localStorage.removeItem('serve_trial_user')
  sessionStorage.removeItem('serve_pending_password')
  sessionStorage.removeItem('serve_pos_bootstrap')
  sessionStorage.removeItem('serve_show_welcome')
}

export const WELCOME_FLAG_KEY = 'serve_show_welcome'

export function markWelcomePending() {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(WELCOME_FLAG_KEY, '1')
}

export function shouldShowWelcome() {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(WELCOME_FLAG_KEY) === '1'
}

export function clearWelcomePending() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(WELCOME_FLAG_KEY)
}

/** Open POS after Serve login (skips the registration welcome screen). */
export async function openPosFromTrial() {
  const res = await trialFetch('/trial/pos-bootstrap', { auth: true })
  const url = res.data?.pos?.url
  if (res.data?.pos) {
    sessionStorage.setItem('serve_pos_bootstrap', JSON.stringify(res.data.pos))
  }
  if (!url) {
    throw new Error('Could not open your cafe. Try again.')
  }
  clearWelcomePending()
  window.location.href = lanAwareUrl(url)
}

export async function trialFetch(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getTrialToken()
    if (token) headers.Authorization = `Trial ${token}`
  }

  const res = await fetch(`${getApiBase(process.env.NEXT_PUBLIC_API_BASE_URL)}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    const err = new Error(json.msg || json.message || 'Request failed')
    err.status = res.status
    err.payload = json
    throw err
  }
  return json
}

export const POS_URL = lanAwareUrl(
  process.env.NEXT_PUBLIC_POS_URL || 'http://localhost:7001',
)

/** Production: https://{slug}.{TENANT_BASE_DOMAIN}/#pos_token=… */
export function buildPosEntryUrl(slug, token) {
  const hash = token ? `#pos_token=${encodeURIComponent(token)}` : ''
  if (typeof window !== 'undefined' && isLocalBrowser()) {
    const pos = localPosOrigin()
    return `${pos.origin}/?tenant=${encodeURIComponent(slug)}${hash}`
  }
  const base = String(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || '')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '')
  if (process.env.NODE_ENV === 'production' && base) {
    return `https://${slug}.${base}/${hash}`
  }
  const pos = (process.env.NEXT_PUBLIC_POS_URL || 'http://localhost:7001').replace(
    /\/$/,
    '',
  )
  return `${pos}/?tenant=${encodeURIComponent(slug)}${hash}`
}

function isLocalBrowser() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    /^192\.168\.\d+\.\d+$/.test(h)
  )
}

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
