import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSessionFailure, forceLoginRedirect } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { LoadingScreen } from '@/components/LoadingScreen'

export function RequireAuth() {
  const { isAuthenticated, refreshMe, logout } = useAuth()
  const location = useLocation()
  const [ready, setReady] = useState(!isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      setReady(true)
      return
    }
    let cancelled = false
    refreshMe()
      .catch((err) => {
        if (cancelled) return
        // Expired / invalid token — send user to login (platformFetch also clears session).
        if (isSessionFailure(err)) {
          logout()
          forceLoginRedirect()
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, refreshMe, logout])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!ready) return <LoadingScreen label="Loading session…" />

  return <Outlet />
}
