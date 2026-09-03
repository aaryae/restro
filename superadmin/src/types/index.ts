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
  ownerUsername?: string | null
  businessType?: string | null
  address?: string | null
  trialEndsAt?: string | null
  selfServeTrialExtendedAt?: string | null
  statusBeforeSuspend?: CafeStatus | null
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

/** Platform (Serve) outbound mail — public.smtp */
export type PlatformSmtp =
  | { configured: false }
  | {
      configured: true
      id: number
      username: string
      host: string
      port: number
      secure: boolean
      hasPasskey: boolean
    }

export type PlatformSmtpInput = {
  username: string
  host: string
  port: number
  secure: boolean
  passkey?: string
}

export type CafeEmailTemplate = {
  key: string
  label: string
  description: string
  trigger: string
  variables: string[]
  isCustom: boolean
  subject: string
  bodyHtml: string
  bodyText: string
  preview: {
    subject: string
    html: string
    text: string
  }
  updatedAt?: string | null
}

export type CafeEmailTemplateInput = {
  subject: string
  bodyHtml: string
  bodyText: string
}
