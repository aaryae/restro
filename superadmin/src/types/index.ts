export type CafeStatus =
  | 'provisioning'
  | 'trial'
  | 'active'
  | 'expired'
  | 'suspended'
  | 'failed'
  | 'deleted'

export type Cafe = {
  id: number
  slug: string
  name: string
  status: CafeStatus
  ownerEmail?: string | null
  ownerPhone?: string | null
  businessType?: string | null
  address?: string | null
  trialEndsAt?: string | null
  activatedAt?: string | null
  hostingEndsAt?: string | null
  createdAt: string
  updatedAt?: string
}

export type ProvisioningJob = {
  id: number
  tenantId: number
  cafeName?: string
  slug?: string
  status: 'pending' | 'running' | 'success' | 'failed'
  errorMessage?: string | null
  startedAt?: string | null
  finishedAt?: string | null
}

export type AuditLog = {
  id: number
  actor: string
  actorName?: string | null
  action: string
  cafeName?: string | null
  cafeSlug?: string | null
  meta?: string | null
  createdAt: string
}

/** Platform panel roles — not cafe POS Super Admin / Admin. */
export type PlatformRole = 'owner' | 'operator'

export type PlatformPermission =
  | 'users.manage'
  | 'dashboard.view'
  | 'cafes.section'
  | 'cafes.create'
  | 'cafes.view'
  | 'cafes.activate'
  | 'cafes.extend'
  | 'cafes.suspend'
  | 'cafes.impersonate'
  | 'audit.read'

export type PlatformAccount = {
  id: number
  username: string
  name: string
  platformRole: PlatformRole
  platformRoleLabel?: string
  permissions: PlatformPermission[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type PlatformPermissionOption = {
  key: PlatformPermission
  label: string
}
