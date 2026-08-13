import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearPlatformSession,
  getPlatformToken,
  getPlatformUser,
  setPlatformSession,
} from '@/api/client'
import { fetchMe, loginPlatform, type PlatformUser } from '@/api/platform'
import type { PlatformPermission, PlatformRole } from '@/types'

type AuthUser = Omit<PlatformUser, 'token'>

type AuthState = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  platformRole: PlatformRole | null
  permissions: PlatformPermission[]
  can: (permission: PlatformPermission) => boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function normalizeUser(raw: Partial<AuthUser> | null): AuthUser | null {
  if (!raw?.id || !raw.username || !raw.name) return null
  const platformRole = (raw.platformRole || 'operator') as PlatformRole
  return {
    id: raw.id,
    username: raw.username,
    name: raw.name,
    platformRole,
    permissions: (raw.permissions || []) as PlatformPermission[],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getPlatformToken())
  const [user, setUser] = useState<AuthUser | null>(() =>
    normalizeUser(getPlatformUser()),
  )

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginPlatform(username, password)
    if (!data.token) throw new Error('Missing token')
    const nextUser: AuthUser = {
      id: data.id,
      username: data.username,
      name: data.name,
      platformRole: data.platformRole || 'operator',
      permissions: data.permissions || [],
    }
    setPlatformSession({
      token: data.token,
      ...nextUser,
    })
    setToken(data.token)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    clearPlatformSession()
    setToken(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    const me = await fetchMe()
    const nextUser = normalizeUser(me)
    setUser(nextUser)
    if (nextUser) {
      localStorage.setItem('serve_platform_user', JSON.stringify(nextUser))
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      platformRole: user?.platformRole ?? null,
      permissions: user?.permissions ?? [],
      can: (permission: PlatformPermission) =>
        (user?.permissions ?? []).includes(permission),
      login,
      logout,
      refreshMe,
    }),
    [user, token, login, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
