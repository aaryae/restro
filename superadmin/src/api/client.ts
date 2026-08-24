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

/** AuthProvider registers this so 401s clear React auth state and redirect. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

function handleUnauthorized() {
  clearPlatformSession()
  onUnauthorized?.()
  // Hard navigate so pages never flash the "Session expired" error banner.
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.assign('/login')
  }
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
    if (auth && status === 401) {
      handleUnauthorized()
    }
    throw new ApiError(
      json.msg || json.message || 'Request failed',
      status,
      json,
    )
  }

  return json.data as T
}

export { API_BASE }
