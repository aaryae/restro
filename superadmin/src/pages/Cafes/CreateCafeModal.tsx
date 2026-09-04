import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { createCafe, type CreateCafeInput } from '@/api/platform'
import { ApiError } from '@/api/client'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { generateOwnerPassword } from '@/lib/password'
import {
  emailText,
  FieldError,
  fieldInputClass,
  hasErrors,
  intInRange,
  optionalMin,
  optionalOwnerUsernameText,
  passwordText,
  phoneText,
  requiredText,
  slugText,
  type FieldErrors,
} from '@/lib/formValidation'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (result: {
    cafeName: string
    slug: string
    ownerUsername?: string
    ownerPassword?: string
  }) => void
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  slug: '',
  username: '',
  ownerName: '',
  businessType: '',
  address: '',
  status: 'trial' as 'trial' | 'active',
  trialDays: '14',
}

type CafeField =
  | 'name'
  | 'email'
  | 'phone'
  | 'password'
  | 'slug'
  | 'username'
  | 'ownerName'
  | 'trialDays'

function slugifyPreview(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

function validateCafeForm(form: typeof emptyForm): FieldErrors<CafeField> {
  const errors: FieldErrors<CafeField> = {
    name: requiredText(form.name, 'Cafe name', 2),
    email: emailText(form.email, 'Owner email'),
    phone: phoneText(form.phone),
    password: passwordText(form.password, { required: false, min: 6 }),
    slug: slugText(form.slug),
    username: optionalOwnerUsernameText(form.username),
    ownerName: optionalMin(form.ownerName, 'Owner name', 2),
  }

  if (form.status === 'trial') {
    errors.trialDays = intInRange(form.trialDays, 'Trial days', 1, 90)
  }

  return errors
}

export function CreateCafeModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<CafeField>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{
    cafeName: string
    slug: string
    ownerUsername?: string
    ownerPassword?: string
  } | null>(null)
  const [copied, setCopied] = useState<'user' | 'pass' | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setFieldErrors({})
    setError('')
    setSubmitting(false)
    setTouched(false)
    setCreatedCreds(null)
    setCopied(null)
  }, [open])

  useBodyScrollLock(open)

  if (!open) return null

  function update<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (touched) setFieldErrors(validateCafeForm(next))
      return next
    })
    if (error) setError('')
  }

  function fillGeneratedPassword() {
    const password = generateOwnerPassword()
    setForm((prev) => {
      const next = { ...prev, password }
      if (touched) setFieldErrors(validateCafeForm(next))
      return next
    })
    setFieldErrors((prev) => ({ ...prev, password: '' }))
    if (error) setError('')
  }

  async function copyText(value: string, which: 'user' | 'pass') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore clipboard failures
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const nextErrors = validateCafeForm(form)
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      setError('Please fix the highlighted fields.')
      return
    }

    setError('')
    setSubmitting(true)

    const payload: CreateCafeInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password.trim() || undefined,
      slug: form.slug.trim() || undefined,
      username: form.username.trim() || undefined,
      ownerName: form.ownerName.trim() || undefined,
      businessType: form.businessType.trim() || undefined,
      address: form.address.trim() || undefined,
      status: form.status,
      trialDays:
        form.status === 'trial'
          ? Math.min(90, Math.max(1, Number(form.trialDays) || 14))
          : undefined,
    }

    try {
      const result = await createCafe(payload)
      const created = {
        cafeName: result.cafe.name,
        slug: result.cafe.slug,
        ownerUsername: result.ownerUsername,
        ownerPassword: result.ownerPassword,
      }
      onCreated(created)
      // Prefer in-modal reveal over toasting secrets.
      if (created.ownerPassword) {
        setCreatedCreds(created)
      } else {
        onClose()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create cafe')
    } finally {
      setSubmitting(false)
    }
  }

  const slugHint = form.slug.trim() || slugifyPreview(form.name) || 'slug'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={() => !submitting && !createdCreds && onClose()}
      />
      <div className="relative flex max-h-[min(100dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[min(90dvh,880px)] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {createdCreds ? 'Cafe created' : 'Create cafe'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {createdCreds
                ? 'Copy the owner credentials now — they will not be shown again.'
                : 'Provisions schema, migrations, and owner login.'}
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {createdCreds ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {createdCreds.cafeName} is ready.
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {createdCreds.ownerUsername ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Username
                    </p>
                    <p className="truncate font-mono text-sm text-slate-900">
                      {createdCreds.ownerUsername}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      copyText(createdCreds.ownerUsername || '', 'user')
                    }
                  >
                    {copied === 'user' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              ) : null}
              {createdCreds.ownerPassword ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Temp password
                    </p>
                    <p className="truncate font-mono text-sm text-slate-900">
                      {createdCreds.ownerPassword}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      copyText(createdCreds.ownerPassword || '', 'pass')
                    }
                  >
                    {copied === 'pass' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Cafe name *
              </span>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={fieldInputClass(Boolean(fieldErrors.name))}
                placeholder="Hillside Cafe"
              />
              <FieldError message={fieldErrors.name} />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Owner username
              </span>
              <input
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                className={fieldInputClass(Boolean(fieldErrors.username))}
                placeholder="Same as cafe name if empty"
                autoComplete="off"
              />
              <FieldError message={fieldErrors.username} />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Owner email *
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={fieldInputClass(Boolean(fieldErrors.email))}
                placeholder="owner@example.com"
              />
              <FieldError message={fieldErrors.email} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Owner name
              </span>
              <input
                value={form.ownerName}
                onChange={(e) => update('ownerName', e.target.value)}
                className={fieldInputClass(Boolean(fieldErrors.ownerName))}
                placeholder="Optional"
              />
              <FieldError message={fieldErrors.ownerName} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Owner phone
              </span>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={fieldInputClass(Boolean(fieldErrors.phone))}
                placeholder="Optional"
              />
              <FieldError message={fieldErrors.phone} />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Slug
              </span>
              <input
                value={form.slug}
                onChange={(e) =>
                  update(
                    'slug',
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  )
                }
                className={fieldInputClass(Boolean(fieldErrors.slug))}
                placeholder="auto from name if empty"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {slugHint}.
                {String(import.meta.env.VITE_TENANT_BASE_DOMAIN || 'localhost').replace(
                  /^\.+|\.+$/g,
                  '',
                ) || 'localhost'}
              </p>
              <FieldError message={fieldErrors.slug} />
            </label>

            <label className="block sm:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600">
                  Owner password
                </span>
                <button
                  type="button"
                  onClick={fillGeneratedPassword}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Auto-generate
                </button>
              </div>
              <PasswordInput
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Optional — use auto-generate or leave blank"
                className={
                  fieldErrors.password
                    ? '[&_input]:border-red-400 [&_input]:focus:border-red-500'
                    : undefined
                }
              />
              <FieldError message={fieldErrors.password} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Status
              </span>
              <select
                value={form.status}
                onChange={(e) =>
                  update('status', e.target.value as 'trial' | 'active')
                }
                className={fieldInputClass(false, 'bg-white')}
              >
                <option value="trial">Trial</option>
                <option value="active">Active</option>
              </select>
            </label>

            {form.status === 'trial' ? (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Trial days *
                </span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={form.trialDays}
                  onChange={(e) => update('trialDays', e.target.value)}
                  className={fieldInputClass(Boolean(fieldErrors.trialDays))}
                />
                <FieldError message={fieldErrors.trialDays} />
              </label>
            ) : (
              <div />
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Business type
              </span>
              <input
                value={form.businessType}
                onChange={(e) => update('businessType', e.target.value)}
                className={fieldInputClass()}
                placeholder="Cafe / Restaurant"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Address
              </span>
              <input
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className={fieldInputClass()}
                placeholder="Optional"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create cafe'
              )}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
