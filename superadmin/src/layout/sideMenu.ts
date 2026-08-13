import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  LayoutDashboard,
  ScrollText,
  Settings,
} from 'lucide-react'
import type { PlatformPermission } from '@/types'

export type SideMenuItem = {
  key: string
  label: string
  path: string
  icon: LucideIcon
  /** If set, item is shown only when user has this permission (owners have all). */
  permission?: PlatformPermission
}

export const sideMenuItems: SideMenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
  },
  {
    key: 'cafes',
    label: 'Cafes',
    path: '/cafes',
    icon: Building2,
    permission: 'cafes.section',
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    path: '/audit',
    icon: ScrollText,
    permission: 'audit.read',
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    permission: 'users.manage',
  },
]
