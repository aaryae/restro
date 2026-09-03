import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  FileText,
  LayoutDashboard,
  Mail,
  ScrollText,
  Settings,
  Users,
} from 'lucide-react'
import type { PlatformPermission } from '@/types'

export type SideMenuChild = {
  key: string
  label: string
  path: string
  icon: LucideIcon
  permission?: PlatformPermission
}

export type SideMenuItem = {
  key: string
  label: string
  path: string
  icon: LucideIcon
  /** If set, item is shown only when user has this permission (owners have all). */
  permission?: PlatformPermission
  children?: SideMenuChild[]
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
    children: [
      {
        key: 'operators',
        label: 'Operators',
        path: '/settings/operators',
        icon: Users,
        permission: 'users.manage',
      },
      {
        key: 'smtp',
        label: 'SMTP',
        path: '/settings/smtp',
        icon: Mail,
        permission: 'users.manage',
      },
      {
        key: 'email-templates',
        label: 'Owner emails',
        path: '/settings/email-templates',
        icon: FileText,
        permission: 'users.manage',
      },
    ],
  },
]
