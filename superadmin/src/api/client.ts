function lanAwareApiBase(raw: string) {
  if (typeof window === 'undefined') return raw.replace(/\/$/, '')
  try {
    const u = new URL(raw, window.location.origin)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      u.hostname = window.location.hostname
    }
    return (u.origin + u.pathname).replace(/\/$/, '')
  } catch {
    return raw.replace(/\/$/, '')
  }
}

const API_BASE = lanAwareApiBase(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
)

const TOKEN_KEY = 'serve_platform_token'
const USER_KEY = 'serve_platform_user'

export function getPlatformToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getPlatformUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setPlatformSession(data: {
  token: string
  id: number
  username: string
  name: string
  imageUrl?: string | null
  platformRole?: string
  permissions?: string[]
}) {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: data.id,
      username: data.username,
      name: data.name,
      imageUrl: data.imageUrl || null,
      platformRole: data.platformRole || 'operator',
      permissions: data.permissions || [],
    }),
  )
}

export function clearPlatformSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

type FetchOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

let onUnauthorized: (() => void) | null = null
let redirectingToLogin = false

function getErrorStatus(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status
    if (typeof status === 'number') return status
  }
  return 0
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') return message
  }
  return ''
}

function shouldForceLogin(status: number, message: string) {
  const normalized = message.toLowerCase()
  if (
    normalized.includes('session expired') ||
    normalized.includes('sign in again') ||
    normalized.includes('invalid platform session') ||
    normalized.includes('authentication failed') ||
    normalized.includes("you're not authorized") ||
    normalized.includes('not authenticated')
  ) {
    return true
  }
  if (status === 401) return true
  if (status === 403 && !normalized.includes('do not have permission')) {
    return true
  }
  return false
}

export function isSessionFailure(error: unknown) {
  return shouldForceLogin(getErrorStatus(error), getErrorMessage(error))
}

/** AuthProvider registers this so auth failures clear React auth state and redirect. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export function forceLoginRedirect() {
  if (redirectingToLogin || typeof window === 'undefined') return
  if (window.location.pathname.startsWith('/login')) return
  redirectingToLogin = true
  clearPlatformSession()
  onUnauthorized?.()
  window.location.replace('/login')
}

function handleUnauthorized() {
  forceLoginRedirect()
}

export async function platformFetch<T = unknown>(
  path: string,
  { method = 'GET', body, auth = true, signal }: FetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = getPlatformToken()
    if (!token) {
      handleUnauthorized()
      throw new ApiError('Not authenticated', 401)
    }
    headers.Authorization = `Platform ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    const status = res.status || 500
    const message = json.msg || json.message || 'Request failed'
    if (auth && shouldForceLogin(status, message)) {
      handleUnauthorized()
    }
    throw new ApiError(message, status, json)
  }

  return json.data as T
}

/** Multipart upload (do not set Content-Type — browser sets boundary). */
export async function platformUpload<T = unknown>(
  path: string,
  formData: FormData,
  { signal }: { signal?: AbortSignal } = {},
): Promise<T> {
  const token = getPlatformToken()
  if (!token) {
    handleUnauthorized()
    throw new ApiError('Not authenticated', 401)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Platform ${token}` },
    body: formData,
    signal,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    const status = res.status || 500
    const message = json.msg || json.message || 'Upload failed'
    if (shouldForceLogin(status, message)) {
      handleUnauthorized()
    }
    throw new ApiError(message, status, json)
  }

  return json.data as T
}

/** Resolve a stored resource path (e.g. resources/foo.jpg) to a full URL. */
export function buildAssetUrl(path?: string | null): string {
  if (!path || path === 'null' || path === 'undefined') return ''
  const trimmed = String(path).trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed
  }
  const origin = API_BASE.replace(/\/api\/v1\/?$/, '')
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${origin}${normalized}`
}

export { API_BASE }
