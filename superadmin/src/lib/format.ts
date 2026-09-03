export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Compact relative time for feeds (e.g. "3m ago"). */
export function formatRelativeTime(value?: string | null) {
  if (!value) return '—'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return '—'
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 45) return 'just now'
  if (diffSec < 3600) return `${Math.max(1, Math.round(diffSec / 60))}m ago`
  if (diffSec < 86400) return `${Math.max(1, Math.round(diffSec / 3600))}h ago`
  if (diffSec < 86400 * 7) return `${Math.max(1, Math.round(diffSec / 86400))}d ago`
  return formatDate(value)
}

export function formatCafeStatus(status?: string | null) {
  if (!status) return '—'
  const key = status.trim()
  if (CAFE_STATUS_LABELS[key]) return CAFE_STATUS_LABELS[key]
  return humanizeEnum(key)
}

const CAFE_STATUS_LABELS: Record<string, string> = {
  provisioning: 'Provisioning',
  trial: 'Trial',
  active: 'Active',
  expired: 'Expired',
  suspended: 'Suspended',
  failed: 'Failed',
  deleted: 'Deleted',
}

/** Countdown until trial ends, or how long ago it expired. */
export function formatTrialDaysLeft(
  trialEndsAt?: string | null,
  status?: string | null,
) {
  if (!trialEndsAt) return '—'
  if (status === 'active') return 'N/A (active)'

  const end = new Date(trialEndsAt).getTime()
  if (Number.isNaN(end)) return '—'

  const diffDays = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000))
  if (diffDays > 1) return `${diffDays} days left`
  if (diffDays === 1) return '1 day left'
  if (diffDays === 0) return 'Ends today'

  const past = Math.abs(diffDays)
  return `Expired ${past} day${past === 1 ? '' : 's'} ago`
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: 'Created cafe',
  unsuspend: 'Unsuspended cafe',
  activate: 'Activated cafe',
  suspend: 'Suspended cafe',
  extend_trial: 'Extended trial',
  impersonate: 'Opened POS',
  login: 'Signed in',
  login_failed: 'Failed sign-in',
  'platform_user.create': 'Created operator',
  'platform_user.update': 'Updated operator',
  'platform_user.deactivate': 'Deactivated operator',
  'platform_user.delete': 'Deleted operator',
}

export const AUDIT_ACTION_FILTER_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function formatAuditAction(action?: string | null) {
  if (!action) return '—'
  const key = action.trim()
  if (AUDIT_ACTION_LABELS[key]) return AUDIT_ACTION_LABELS[key]
  return humanizeEnum(key)
}

/** Stored in audit meta for ops, never shown in the UI. */
const HIDDEN_AUDIT_META_KEYS = new Set(['ip', 'userAgent'])

const AUDIT_VALUE_LABELS: Record<string, string> = {
  not_found_or_inactive: 'Account not found or inactive',
  not_found: 'Account not found',
  inactive: 'Account inactive',
  bad_password: 'Incorrect password',
  owner: 'Owner',
  operator: 'Operator',
}

/** Turn snake_case / enum tokens into a readable label. */
function humanizeEnum(value?: string | null) {
  if (!value) return '—'
  const key = value.trim()
  if (AUDIT_VALUE_LABELS[key]) return AUDIT_VALUE_LABELS[key]
  if (AUDIT_ACTION_LABELS[key]) return AUDIT_ACTION_LABELS[key]
  return key
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const PERMISSION_LABELS: Record<string, string> = {
  'users.manage': 'Manage users',
  'dashboard.view': 'Show Dashboard',
  'cafes.section': 'Show Cafes section',
  'cafes.create': 'Create cafe',
  'cafes.view': 'View cafe',
  'cafes.activate': 'Activate cafe',
  'cafes.extend': 'Extend trial',
  'cafes.suspend': 'Suspend cafe',
  'cafes.impersonate': 'Open POS',
  'audit.read': 'Show Audit logs',
}

function parseMeta(meta?: string | null): Record<string, unknown> | null {
  if (!meta) return null
  if (typeof meta === 'object') return meta as Record<string, unknown>
  try {
    const parsed = JSON.parse(meta)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function labelPermission(value: string) {
  return PERMISSION_LABELS[value] || value.replace(/[._]/g, ' ')
}

function toPermSet(perms: unknown): Set<string> {
  return new Set(Array.isArray(perms) ? perms.map(String) : [])
}

/** Compact permission change: only added / removed labels. */
function formatPermissionsDiff(from: unknown, to: unknown): string {
  const prev = toPermSet(from)
  const next = toPermSet(to)
  const added = [...next].filter((p) => !prev.has(p)).map(labelPermission)
  const removed = [...prev].filter((p) => !next.has(p)).map(labelPermission)

  const parts: string[] = []
  if (added.length) parts.push(`+${added.join(', ')}`)
  if (removed.length) parts.push(`−${removed.join(', ')}`)
  if (!parts.length) return 'Permissions unchanged'
  return `Permissions: ${parts.join(' · ')}`
}

function samePermissions(a: unknown, b: unknown) {
  const left = Array.isArray(a) ? a.map(String).sort() : []
  const right = Array.isArray(b) ? b.map(String).sort() : []
  if (left.length !== right.length) return false
  return left.every((value, i) => value === right[i])
}

function statusLabel(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Active' : 'Inactive'
  if (typeof value === 'string') return humanizeEnum(value)
  return String(value)
}

/** Push only changed previous→next fields into `lines`. */
function pushOperatorDiffLines(
  lines: string[],
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
) {
  let changed = false

  if (previous.name !== next.name) {
    lines.push(`Name: ${String(previous.name ?? '—')} → ${String(next.name ?? '—')}`)
    changed = true
  }
  if (previous.platformRole !== next.platformRole) {
    lines.push(
      `Role: ${humanizeEnum(String(previous.platformRole ?? ''))} → ${humanizeEnum(String(next.platformRole ?? ''))}`,
    )
    changed = true
  }
  if (previous.isActive !== next.isActive) {
    lines.push(
      `Status: ${statusLabel(previous.isActive)} → ${statusLabel(next.isActive)}`,
    )
    changed = true
  }
  if (!samePermissions(previous.permissions, next.permissions)) {
    lines.push(formatPermissionsDiff(previous.permissions, next.permissions))
    changed = true
  }

  return changed
}

/** Full readable detail lines for audit meta (not raw JSON, not over-summarized). */
export function formatAuditMetaLines(meta?: string | null): string[] {
  const data = parseMeta(meta)
  if (!data) {
    const raw = meta?.trim()
    return raw ? [raw] : []
  }

  const lines: string[] = []

  if (typeof data.username === 'string') {
    lines.push(`@${data.username}`)
  }
  if (typeof data.email === 'string') {
    lines.push(`Email: ${data.email}`)
  }
  if (typeof data.slug === 'string') {
    lines.push(`Slug: ${data.slug}`)
  }
  if (typeof data.status === 'string') {
    lines.push(`Status: ${humanizeEnum(data.status)}`)
  }
  if (typeof data.ownerEmail === 'string') {
    lines.push(`Owner email: ${data.ownerEmail}`)
  }
  if (typeof data.platformRole === 'string') {
    lines.push(`Role: ${humanizeEnum(data.platformRole)}`)
  }
  if (typeof data.previousStatus === 'string') {
    lines.push(`From: ${humanizeEnum(data.previousStatus)}`)
  }
  if (typeof data.reason === 'string' && data.reason) {
    lines.push(`Reason: ${humanizeEnum(data.reason)}`)
  } else if (data.reason === null) {
    lines.push('Reason: none')
  }
  if (typeof data.days === 'number') {
    lines.push(`+${data.days} days`)
  }
  if (typeof data.trialEndsAt === 'string') {
    lines.push(`Until ${formatDateTime(data.trialEndsAt)}`)
  }
  if (typeof data.ownerUserId === 'number' || typeof data.ownerUserId === 'string') {
    lines.push(`POS user #${data.ownerUserId}`)
  }
  if (Array.isArray(data.permissions) && !data.previous && !data.next && !data.changes) {
    const count = data.permissions.length
    lines.push(count ? `${count} permission${count === 1 ? '' : 's'}` : 'No permissions')
  }

  if (data.changes && typeof data.changes === 'object') {
    const changes = data.changes as Record<string, unknown>
    for (const [field, value] of Object.entries(changes)) {
      if (field === 'passwordChanged' && value) {
        lines.push('Password updated')
        continue
      }
      if (!value || typeof value !== 'object') continue
      const diff = value as { from?: unknown; to?: unknown }
      if (field === 'permissions') {
        lines.push(formatPermissionsDiff(diff.from, diff.to))
      } else if (field === 'isActive') {
        lines.push(`Status: ${statusLabel(diff.from)} → ${statusLabel(diff.to)}`)
      } else if (field === 'platformRole') {
        lines.push(
          `Role: ${humanizeEnum(String(diff.from ?? ''))} → ${humanizeEnum(String(diff.to ?? ''))}`,
        )
      } else if (field === 'name') {
        lines.push(`Name: ${String(diff.from ?? '—')} → ${String(diff.to ?? '—')}`)
      } else {
        lines.push(
          `${humanizeEnum(field)}: ${String(diff.from ?? '—')} → ${String(diff.to ?? '—')}`,
        )
      }
    }
  } else if (
    data.previous &&
    typeof data.previous === 'object' &&
    data.next &&
    typeof data.next === 'object'
  ) {
    const changed = pushOperatorDiffLines(
      lines,
      data.previous as Record<string, unknown>,
      data.next as Record<string, unknown>,
    )
    if (!changed && data.passwordChanged) {
      lines.push('Password updated')
    } else if (!changed) {
      lines.push('No field changes recorded')
    }
  } else if (data.passwordChanged) {
    lines.push('Password updated')
  }

  // Any leftover keys not already covered
  const known = new Set([
    'username',
    'email',
    'slug',
    'status',
    'ownerEmail',
    'platformRole',
    'previousStatus',
    'reason',
    'days',
    'trialEndsAt',
    'ownerUserId',
    'targetUserId',
    'permissions',
    'previous',
    'next',
    'changes',
    'passwordChanged',
  ])
  for (const [key, value] of Object.entries(data)) {
    if (known.has(key) || HIDDEN_AUDIT_META_KEYS.has(key) || value == null) continue
    if (typeof value === 'object') {
      lines.push(`${humanizeEnum(key)}: ${JSON.stringify(value)}`)
    } else {
      lines.push(`${humanizeEnum(key)}: ${String(value)}`)
    }
  }

  return lines
}

export function formatAuditMeta(meta?: string | null) {
  const lines = formatAuditMetaLines(meta)
  return lines.length ? lines.join(' · ') : '—'
}

export type AuditDetailSection = {
  title: string
  rows: Array<{ label: string; value: string; tone?: 'default' | 'add' | 'remove' }>
}

/** Richer structured details for the audit sidebar. */
export function formatAuditDetailSections(
  meta?: string | null,
): AuditDetailSection[] {
  const data = parseMeta(meta)
  if (!data) {
    const raw = meta?.trim()
    return raw
      ? [{ title: 'Raw', rows: [{ label: 'Payload', value: raw }] }]
      : []
  }

  const sections: AuditDetailSection[] = []
  const overview: AuditDetailSection['rows'] = []

  if (typeof data.targetUserId === 'number' || typeof data.targetUserId === 'string') {
    overview.push({ label: 'Operator id', value: String(data.targetUserId) })
  }
  if (typeof data.name === 'string') {
    overview.push({ label: 'Operator name', value: data.name })
  }
  if (typeof data.username === 'string') {
    overview.push({ label: 'Username', value: `@${data.username}` })
  }
  if (typeof data.email === 'string') {
    overview.push({ label: 'Email', value: data.email })
  }
  if (typeof data.slug === 'string') {
    overview.push({ label: 'Slug', value: data.slug })
  }
  if (typeof data.status === 'string') {
    overview.push({ label: 'Status', value: humanizeEnum(data.status) })
  }
  if (typeof data.ownerEmail === 'string') {
    overview.push({ label: 'Owner email', value: data.ownerEmail })
  }
  if (typeof data.platformRole === 'string') {
    overview.push({ label: 'Role', value: humanizeEnum(data.platformRole) })
  }
  if (typeof data.previousStatus === 'string') {
    overview.push({ label: 'Previous status', value: humanizeEnum(data.previousStatus) })
  }
  if (typeof data.reason === 'string' && data.reason) {
    overview.push({ label: 'Reason', value: humanizeEnum(data.reason) })
  } else if (data.reason === null) {
    overview.push({ label: 'Reason', value: 'None' })
  }
  if (typeof data.days === 'number') {
    overview.push({ label: 'Extended by', value: `${data.days} days` })
  }
  if (typeof data.trialEndsAt === 'string') {
    overview.push({
      label: 'Trial ends',
      value: formatDateTime(data.trialEndsAt),
    })
  }
  if (typeof data.ownerUserId === 'number' || typeof data.ownerUserId === 'string') {
    overview.push({ label: 'POS user id', value: String(data.ownerUserId) })
  }
  if (overview.length) {
    sections.push({ title: 'Overview', rows: overview })
  }

  if (Array.isArray(data.permissions) && !data.previous && !data.next && !data.changes) {
    const perms = data.permissions.map((p) => labelPermission(String(p)))
    sections.push({
      title: 'Permissions granted',
      rows: perms.length
        ? perms.map((value) => ({ label: 'Permission', value, tone: 'add' as const }))
        : [{ label: 'Permissions', value: 'none' }],
    })
  }

  const pushDiffSection = (
    previous: Record<string, unknown>,
    next: Record<string, unknown>,
    extras?: { passwordChanged?: boolean },
  ) => {
    const rows: AuditDetailSection['rows'] = []

    if (previous.name !== next.name) {
      rows.push({ label: 'Name (before)', value: String(previous.name ?? '—') })
      rows.push({ label: 'Name (after)', value: String(next.name ?? '—') })
    }
    if (previous.platformRole !== next.platformRole) {
      rows.push({
        label: 'Role (before)',
        value: humanizeEnum(String(previous.platformRole ?? '')),
      })
      rows.push({
        label: 'Role (after)',
        value: humanizeEnum(String(next.platformRole ?? '')),
      })
    }
    if (previous.isActive !== next.isActive) {
      rows.push({
        label: 'Status (before)',
        value: statusLabel(previous.isActive),
      })
      rows.push({
        label: 'Status (after)',
        value: statusLabel(next.isActive),
      })
    }
    if (!samePermissions(previous.permissions, next.permissions)) {
      const prev = toPermSet(previous.permissions)
      const nxt = toPermSet(next.permissions)
      const added = [...nxt].filter((p) => !prev.has(p)).map(labelPermission)
      const removed = [...prev].filter((p) => !nxt.has(p)).map(labelPermission)

      for (const value of added) {
        rows.push({ label: 'Added', value, tone: 'add' })
      }
      for (const value of removed) {
        rows.push({ label: 'Removed', value, tone: 'remove' })
      }

      const afterList = [...nxt].map(labelPermission)
      if (afterList.length) {
        rows.push({
          label: 'Permissions after',
          value: afterList.join(', '),
        })
      }
    }
    if (extras?.passwordChanged) {
      rows.push({ label: 'Password', value: 'Updated' })
    }

    if (rows.length) {
      sections.push({ title: 'What changed', rows })
    } else {
      sections.push({
        title: 'What changed',
        rows: [{ label: 'Result', value: 'No field changes recorded' }],
      })
    }
  }

  if (data.changes && typeof data.changes === 'object') {
    const changes = data.changes as Record<string, unknown>
    const previous: Record<string, unknown> = {}
    const next: Record<string, unknown> = {}
    let passwordChanged = false

    for (const [field, value] of Object.entries(changes)) {
      if (field === 'passwordChanged' && value) {
        passwordChanged = true
        continue
      }
      if (!value || typeof value !== 'object') continue
      const diff = value as { from?: unknown; to?: unknown }
      previous[field] = diff.from
      next[field] = diff.to
    }

    pushDiffSection(previous, next, { passwordChanged })
  } else if (
    data.previous &&
    typeof data.previous === 'object' &&
    data.next &&
    typeof data.next === 'object'
  ) {
    pushDiffSection(
      data.previous as Record<string, unknown>,
      data.next as Record<string, unknown>,
      { passwordChanged: Boolean(data.passwordChanged) },
    )
  } else if (data.passwordChanged) {
    sections.push({
      title: 'What changed',
      rows: [{ label: 'Password', value: 'Updated' }],
    })
  }

  return sections
}

