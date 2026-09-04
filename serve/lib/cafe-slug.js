const CAFE_SLUG_KEY = 'serve_cafe_slug'
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
function cafeHostSuffix() {
  return String(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || 'servecafe.app')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '')
}
/**
 * Live typing: keep hyphens, including a trailing one, so "royal-" can become
 * "royal-lasta". Do not collapse the slug to a finished value here.
 */
export function sanitizeCafeSlugInput(raw) {
  if (!raw || typeof raw !== 'string') return ''

  let value = raw.toLowerCase()
  value = value.replace(/^https?:\/\//, '')
  value = value.split('/')[0]
  value = value.split(':')[0]

  if (value.endsWith(`.${cafeHostSuffix()}`)) {
    value = value.slice(0, -(`.${cafeHostSuffix()}`).length)
  }

  if (value.includes('.')) {
    value = value.split('.')[0]
  }

  return value
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

/**
 * Public cafe identifier only — never a secret.
 * Accepts "royal-lasta", "royal-lasta.servecafe.app", or a pasted URL.
 */
export function normalizeCafeSlug(raw) {
  return sanitizeCafeSlugInput(raw).replace(/^-+|-+$/g, '')
}

export function isValidCafeSlug(slug) {
  return SLUG_PATTERN.test(slug || '')
}

export function getRememberedCafeSlug() {
  if (typeof window === 'undefined') return ''
  try {
    return normalizeCafeSlug(localStorage.getItem(CAFE_SLUG_KEY) || '')
  } catch {
    return ''
  }
}

export function rememberCafeSlug(slug) {
  if (typeof window === 'undefined') return
  const normalized = normalizeCafeSlug(slug)
  if (!normalized || !isValidCafeSlug(normalized)) return
  try {
    localStorage.setItem(CAFE_SLUG_KEY, normalized)
  } catch {
    // Private mode / quota — remembering is optional.
  }
}

export const CAFE_SLUG_STORAGE_KEY = CAFE_SLUG_KEY
export const CAFE_HOST_LABEL = cafeHostSuffix()
