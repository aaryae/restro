import { platformFetch, platformUpload } from '@/api/client'
import type {
  AuditLog,
  Cafe,
  CafeEmailTemplate,
  CafeEmailTemplateInput,
  CafeStatus,
  PlatformAccount,
  PlatformPermission,
  PlatformPermissionOption,
  PlatformRole,
  PlatformSmtp,
  PlatformSmtpInput,
} from '@/types'

export type PlatformUser = {
  id: number
  username: string
  name: string
  imageUrl?: string | null
  platformRole: PlatformRole
  permissions: PlatformPermission[]
  token?: string
}

export type Pagination = {
  page: number
  limit: number
  total: number
}

export type Stats = {
  total: number
  active: number
  trial: number
  expired: number
  suspended: number
  failed: number
  provisioning: number
  deleted: number
}

export type StatsTrendPoint = { day: string; count: number }

export type StatsTrendSeriesKey =
  | 'cafesCreated'
  | 'activations'
  | 'suspensions'
  | 'extensions'
  | 'impersonations'
  | 'operatorsCreated'
  | 'auditEvents'

export type StatsTrends = {
  range: string
  days: number
  from: string
  to: string
  series: Record<StatsTrendSeriesKey, StatsTrendPoint[]>
}

export type StatsTrendsParams = {
  range?: '7d' | '30d' | '90d'
  days?: number
  from?: string
  to?: string
}

export async function loginPlatform(username: string, password: string) {
  return platformFetch<PlatformUser>('/platform/login', {
    method: 'POST',
    auth: false,
    body: { username, password },
  })
}

export async function fetchMe() {
  return platformFetch<Omit<PlatformUser, 'token'>>('/platform/me')
}

export async function updateMyProfile(input: {
  name?: string
  imageUrl?: string | null
}) {
  return platformFetch<Omit<PlatformUser, 'token'>>('/platform/me', {
    method: 'PATCH',
    body: input,
  })
}

export async function changeMyPassword(input: {
  currentPassword: string
  newPassword: string
}) {
  return platformFetch<null>('/platform/me/password', {
    method: 'PUT',
    body: input,
  })
}

export async function uploadMyAvatar(file: File) {
  const form = new FormData()
  form.append('image', file)
  return platformUpload<Omit<PlatformUser, 'token'>>('/platform/me/avatar', form)
}

export async function fetchStats() {
  return platformFetch<Stats>('/platform/stats')
}

export async function fetchStatsTrends(params: StatsTrendsParams = {}) {
  const search = new URLSearchParams()
  if (params.from && params.to) {
    search.set('from', params.from)
    search.set('to', params.to)
  } else if (params.days) {
    search.set('days', String(params.days))
  } else if (params.range) {
    search.set('range', params.range)
  } else {
    search.set('range', '30d')
  }
  return platformFetch<StatsTrends>(`/platform/stats/trends?${search}`)
}

export async function fetchCafes(params: {
  page?: number
  limit?: number
  q?: string
  status?: CafeStatus | 'all'
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}) {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.q) search.set('q', params.q)
  if (params.status && params.status !== 'all') search.set('status', params.status)
  if (params.sortBy) search.set('sortBy', params.sortBy)
  if (params.sortDir) search.set('sortDir', params.sortDir)
  const qs = search.toString()
  return platformFetch<{ items: Cafe[]; pagination: Pagination }>(
    `/platform/cafes${qs ? `?${qs}` : ''}`,
  )
}

export async function fetchCafe(id: string | number) {
  return platformFetch<{ cafe: Cafe; activity: AuditLog[] }>(
    `/platform/cafes/${id}`,
  )
}

export type CreateCafeInput = {
  name: string
  email: string
  phone?: string
  password?: string
  slug?: string
  username?: string
  ownerName?: string
  businessType?: string
  address?: string
  status?: 'trial' | 'active'
  trialDays?: number
}

export async function createCafe(input: CreateCafeInput) {
  return platformFetch<{
    cafe: Cafe
    ownerUsername?: string
    ownerPassword?: string
    passwordGenerated?: boolean
  }>('/platform/cafes', {
    method: 'POST',
    body: input,
  })
}

export async function activateCafe(id: number) {
  return platformFetch<Cafe>(`/platform/cafes/${id}/activate`, { method: 'POST' })
}

export async function suspendCafe(id: number, reason?: string) {
  return platformFetch<Cafe>(`/platform/cafes/${id}/suspend`, {
    method: 'POST',
    body: { reason },
  })
}

export async function extendCafeTrial(id: number, days = 7) {
  return platformFetch<Cafe>(`/platform/cafes/${id}/extend-trial`, {
    method: 'POST',
    body: { days },
  })
}

export async function impersonateCafe(id: number) {
  return platformFetch<{
    cafe: Cafe
    pos: {
      username: string
      token: string
      authHeader: string
      tenantSlug: string
      url: string
    }
  }>(`/platform/cafes/${id}/impersonate`, { method: 'POST' })
}

export async function fetchAuditLogs(
  params: {
    page?: number
    limit?: number
    actor?: string
    action?: string
    cafe?: string
  } = {},
) {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.actor) search.set('actor', params.actor)
  if (params.action) search.set('action', params.action)
  if (params.cafe) search.set('cafe', params.cafe)
  const qs = search.toString()
  return platformFetch<{ items: AuditLog[]; pagination: Pagination }>(
    `/platform/audit-logs${qs ? `?${qs}` : ''}`,
  )
}

export async function fetchPlatformUsers(
  params: { page?: number; limit?: number } = {},
) {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  const qs = search.toString()
  return platformFetch<{
    items: PlatformAccount[]
    permissionOptions: PlatformPermissionOption[]
    pagination: Pagination
  }>(`/platform/users${qs ? `?${qs}` : ''}`)
}

export async function createPlatformUser(input: {
  name: string
  username: string
  password: string
  permissions: PlatformPermission[]
}) {
  return platformFetch<PlatformAccount>('/platform/users', {
    method: 'POST',
    body: input,
  })
}

export async function updatePlatformUser(
  id: number,
  input: {
    name?: string
    permissions?: PlatformPermission[]
    isActive?: boolean
    password?: string
  },
) {
  return platformFetch<PlatformAccount>(`/platform/users/${id}`, {
    method: 'PATCH',
    body: input,
  })
}

export async function deletePlatformUser(id: number) {
  return platformFetch<{ id: number }>(`/platform/users/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchPlatformSmtp() {
  return platformFetch<PlatformSmtp>('/platform/smtp')
}

export async function upsertPlatformSmtp(input: PlatformSmtpInput) {
  return platformFetch<PlatformSmtp>('/platform/smtp', {
    method: 'PUT',
    body: input,
  })
}

export async function fetchCafeEmailTemplates() {
  return platformFetch<{ items: CafeEmailTemplate[] }>(
    '/platform/cafe-email-templates',
  )
}

export async function saveCafeEmailTemplate(
  key: string,
  input: CafeEmailTemplateInput,
) {
  return platformFetch<CafeEmailTemplate>(
    `/platform/cafe-email-templates/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      body: input,
    },
  )
}

export async function resetCafeEmailTemplate(key: string) {
  return platformFetch<CafeEmailTemplate>(
    `/platform/cafe-email-templates/${encodeURIComponent(key)}/reset`,
    {
      method: 'POST',
    },
  )
}
