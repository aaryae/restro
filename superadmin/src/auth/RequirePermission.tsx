import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { PageError } from '@/components/LoadingScreen'
import type { PlatformPermission } from '@/types'
import type { ReactNode } from 'react'

export function RequirePermission({
  permission,
  children,
}: {
  permission: PlatformPermission
  children: ReactNode
}) {
  const { can, permissions } = useAuth()

  if (!can(permission)) {
    // Operators with other sections should land somewhere useful.
    if (permissions.includes('cafes.section')) {
      return <Navigate to="/cafes" replace />
    }
    if (permissions.includes('audit.read')) {
      return <Navigate to="/audit" replace />
    }
    if (permissions.includes('users.manage')) {
      return <Navigate to="/settings" replace />
    }
    return (
      <PageError message="You do not have permission to view this page." />
    )
  }

  return children
}
