import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { LoadingScreen } from '@/components/LoadingScreen'

export function RequireAuth() {
  const { isAuthenticated, refreshMe } = useAuth()
  const location = useLocation()
  const [ready, setReady] = useState(!isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      setReady(true)
      return
    }
    let cancelled = false
    refreshMe()
      .catch(() => {
        // Session may be stale; keep token until a protected call fails.
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, refreshMe])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!ready) return <LoadingScreen label="Loading session…" />

  return <Outlet />
}
