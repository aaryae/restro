'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as yup from 'yup'
import {
  clearTrialSession,
  getTrialUser,
  setTrialSession,
  trialFetch,
  markWelcomePending,
} from '@/lib/trial-api'
import { rememberCafeSlug } from '@/lib/cafe-slug'
import { filterNepalLocations } from '@/lib/nepal-locations'
import OnboardBackdrop from '@/components/OnboardBackdrop'

function tenantHostLabel() {
  return String(process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || 'servecafe.app')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '')
}

const TYPES = [
  'FastFood',
  'Resort',
  'Hotel',
  'Bakery',
  'Cloud Kitchen',
  'Bar',
  'Cafe',
  'Restaurant',
  'Others',
]

const restaurantSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .required('Restaurant name is required'),
  phone: yup
    .string()
    .matches(/^(97|98)\d{8}$/, 'Enter a valid Nepal mobile (10 digits, starts with 97/98)')
    .required('Phone number is required'),
  businessType: yup
    .string()
    .oneOf(TYPES, 'Select a business type')
    .required('Type is required'),
  address: yup
    .string()
    .trim()
    .min(3, 'Address must be at least 3 characters')
    .required('Address is required'),
  slug: yup
    .string()
    .trim()
    .min(3, 'URL must be at least 3 characters')
    .max(63, 'URL is too long')
    .matches(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      'Only lowercase letters, numbers, and dashes',
    )
    .required('Cafe URL is required'),
})

export default function CreateRestaurantPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [businessType, setBusinessType] = useState('Cafe')
  const [address, setAddress] = useState('')
  const [addressOpen, setAddressOpen] = useState(false)
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugSuggestions, setSlugSuggestions] = useState([])
  const [slugMessage, setSlugMessage] = useState('')
  const [isSlugAvailable, setIsSlugAvailable] = useState(null)
  const [slugBusy, setSlugBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const addressWrapRef = useRef(null)

  const addressSuggestions = useMemo(
    () => filterNepalLocations(address, 12),
    [address],
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      const u = getTrialUser()
      if (!u?.token) {
        router.replace('/login')
        return
      }

      try {
        const res = await trialFetch('/trial/me', { auth: true })
        if (cancelled) return
        setTrialSession(res.data)
        if (res.data.tenantId) {
          markWelcomePending()
          router.replace('/welcome')
        }
      } catch {
        if (cancelled) return
        clearTrialSession()
        router.replace('/login')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    function onDocClick(e) {
      if (!addressWrapRef.current?.contains(e.target)) {
        setAddressOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!name.trim() || slugTouched) return
    const t = setTimeout(async () => {
      try {
        setSlugBusy(true)
        const res = await trialFetch(
          `/trial/suggest-slug?name=${encodeURIComponent(name)}`,
        )
        const next = res.data?.slug || ''
        const options = Array.isArray(res.data?.suggestions)
          ? res.data.suggestions
          : next
            ? [next]
            : []
        setSlug(next)
        setSlugSuggestions(options)
        setIsSlugAvailable(true)
        setSlugMessage(
          next ? `${next}.${tenantHostLabel()} is available.` : '',
        )
      } catch (err) {
        setIsSlugAvailable(false)
        setSlugMessage(err.message || 'Could not suggest a URL.')
      } finally {
        setSlugBusy(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [name, slugTouched])

  useEffect(() => {
    const value = String(slug || '').trim().toLowerCase()
    if (!value) {
      setIsSlugAvailable(null)
      setSlugMessage('')
      return
    }
    if (value.length < 3) {
      setIsSlugAvailable(null)
      setSlugMessage('URL must be at least 3 characters.')
      return
    }

    let cancelled = false
    const t = setTimeout(async () => {
      setSlugBusy(true)
      try {
        const res = await trialFetch(
          `/trial/slug-available?slug=${encodeURIComponent(value)}`,
        )
        if (cancelled) return
        const payload = res.data || {}
        setIsSlugAvailable(Boolean(payload.available))
        setSlugMessage(
          payload.available
            ? `${value}.${tenantHostLabel()} is available.`
            : formatSlugTakenMessage(value, payload.reason),
        )
        if (!payload.available) {
          setFieldErrors((prev) => ({ ...prev, slug: undefined }))
        }
      } catch (err) {
        if (cancelled) return
        setIsSlugAvailable(false)
        setSlugMessage(err.message || 'Could not check this URL.')
      } finally {
        if (!cancelled) setSlugBusy(false)
      }
    }, 450)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [slug])

  async function checkSlugAvailability(nextSlug = slug) {
    const value = String(nextSlug || '').trim().toLowerCase()
    if (!value) {
      setIsSlugAvailable(false)
      setSlugMessage('Enter a cafe URL first.')
      setFieldErrors((p) => ({ ...p, slug: 'Cafe URL is required' }))
      return false
    }
    if (value.length < 3) {
      setIsSlugAvailable(false)
      setSlugMessage('URL must be at least 3 characters.')
      setFieldErrors((p) => ({
        ...p,
        slug: 'URL must be at least 3 characters',
      }))
      return false
    }
    setSlugBusy(true)
    try {
      const res = await trialFetch(
        `/trial/slug-available?slug=${encodeURIComponent(value)}`,
      )
      const payload = res.data || {}
      setSlug(value)
      const available = Boolean(payload.available)
      setIsSlugAvailable(available)
      const message = available
        ? `${value}.${tenantHostLabel()} is available.`
        : formatSlugTakenMessage(value, payload.reason)
      setSlugMessage(message)
      setFieldErrors((prev) => ({
        ...prev,
        slug: available ? undefined : message,
      }))
      return available
    } catch (err) {
      setIsSlugAvailable(false)
      const message = err.message || 'Could not check this URL right now.'
      setSlugMessage(message)
      return false
    } finally {
      setSlugBusy(false)
    }
  }

  async function suggestSlugFromName() {
    if (!name.trim()) {
      setIsSlugAvailable(false)
      setSlugMessage('Enter a restaurant name first.')
      setFieldErrors((p) => ({
        ...p,
        name: 'Restaurant name is required',
      }))
      return
    }
    setSlugBusy(true)
    try {
      const res = await trialFetch(
        `/trial/suggest-slug?name=${encodeURIComponent(name)}`,
      )
      const next = res.data.slug || ''
      const options = Array.isArray(res.data?.suggestions)
        ? res.data.suggestions
        : next
          ? [next]
          : []
      setSlug(next)
      setSlugSuggestions(options)
      setSlugTouched(true)
      setIsSlugAvailable(true)
      setSlugMessage(`${next}.${tenantHostLabel()} is available.`)
      setFieldErrors((prev) => ({ ...prev, slug: undefined }))
    } catch (err) {
      setIsSlugAvailable(false)
      setSlugMessage(err.message || 'Could not suggest right now.')
    } finally {
      setSlugBusy(false)
    }
  }

  function resetForm() {
    setName('')
    setPhone('')
    setBusinessType('Cafe')
    setAddress('')
    setAddressOpen(false)
    setSlug('')
    setSlugTouched(false)
    setSlugSuggestions([])
    setSlugMessage('')
    setIsSlugAvailable(null)
    setError('')
    setFieldErrors({})
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    try {
      await restaurantSchema.validate(
        { name, phone, businessType, address, slug },
        { abortEarly: false },
      )
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errs = {}
        for (const issue of err.inner) {
          if (issue.path && !errs[issue.path]) errs[issue.path] = issue.message
        }
        setFieldErrors(errs)
        if (errs.slug) {
          setIsSlugAvailable(false)
          setSlugMessage(errs.slug)
        }
        setError('Please fix the highlighted fields.')
        return
      }
      setError(err.message || 'Validation failed')
      return
    }

    const available = await checkSlugAvailability(slug)
    if (!available) {
      setError('This cafe URL is already taken. Pick another or click Suggest.')
      return
    }
    setLoading(true)
    try {
      const res = await trialFetch('/trial/restaurants', {
        method: 'POST',
        auth: true,
        body: { name, phone, businessType, address, slug },
      })
      const merged = { ...res.data, token: res.data.token }
      setTrialSession(merged)
      rememberCafeSlug(slug || res.data.tenant?.slug || res.data.slug)
      if (res.data.pos?.url) {
        sessionStorage.setItem(
          'serve_pos_bootstrap',
          JSON.stringify({
            url: res.data.pos.url,
            tenantSlug: res.data.pos.tenantSlug,
            username: res.data.pos.username,
          }),
        )
      }
      sessionStorage.removeItem('serve_pending_password')
      markWelcomePending()
      sessionStorage.removeItem('serve_resume_setup')
      router.push('/welcome')
    } catch (err) {
      const msg = err.message || 'Could not create restaurant.'
      if (/slug.*(taken|reserved)|already taken|is reserved/i.test(msg)) {
        setIsSlugAvailable(false)
        const slugMsg = formatSlugTakenMessage(slug, msg)
        setSlugMessage(slugMsg)
        setFieldErrors((p) => ({ ...p, slug: slugMsg }))
        setError(slugMsg)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const urlLabel =
    businessType && businessType !== 'Others'
      ? `${businessType.replace(/\s+/g, ' ')} URL`
      : 'Cafe URL'

  return (
    <main className="relative min-h-screen onboard-canvas flex items-center justify-center px-4 py-10 overflow-hidden">
      <OnboardBackdrop />
      <div className="relative z-10 w-full max-w-2xl onboard-card-in">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push('/get-started')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-steam bg-white hover:bg-cream cursor-pointer transition text-roast">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-coffee" />
            <span className="h-1.5 w-6 rounded-full bg-coffee" />
            <span className="h-1.5 w-6 rounded-full bg-coffee" />
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-steam shadow-xl shadow-espresso/[0.04] p-7 sm:p-9">
          <h1 className="font-syne text-xl sm:text-2xl font-800 tracking-[-0.02em] text-espresso">
            Set up your restaurant
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Takes 30 seconds. You can change these later.
          </p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5" noValidate>
            <Field label="Restaurant Name" required error={fieldErrors.name}>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setFieldErrors((p) => ({ ...p, name: undefined }))
                }}
                onBlur={() => {
                  restaurantSchema
                    .validateAt('name', { name })
                    .then(() => setFieldErrors((p) => ({ ...p, name: undefined })))
                    .catch((err) =>
                      setFieldErrors((p) => ({ ...p, name: err.message })),
                    )
                }}
                placeholder="e.g. Amechi Cafe"
                className={inputClass(fieldErrors.name)}
              />
            </Field>

            <Field label="Phone" required error={fieldErrors.phone}>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-xl border border-steam bg-cream px-3 text-sm text-roast">
                  +977
                </span>
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    setFieldErrors((p) => ({ ...p, phone: undefined }))
                  }}
                  onBlur={() => {
                    restaurantSchema
                      .validateAt('phone', { phone })
                      .then(() =>
                        setFieldErrors((p) => ({ ...p, phone: undefined })),
                      )
                      .catch((err) =>
                        setFieldErrors((p) => ({ ...p, phone: err.message })),
                      )
                  }}
                  placeholder="98XXXXXXXX"
                  inputMode="numeric"
                  className={`${inputClass(fieldErrors.phone)} flex-1`}
                />
              </div>
            </Field>

            <Field label="Type" required error={fieldErrors.businessType}>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setBusinessType(t)
                      setFieldErrors((p) => ({ ...p, businessType: undefined }))
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                      businessType === t
                        ? 'coffee-fill text-white border-roast'
                        : 'bg-white text-roast border-steam hover:border-caramel/40'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Address" required error={fieldErrors.address}>
              <div className="relative" ref={addressWrapRef}>
                <input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setAddressOpen(true)
                    setFieldErrors((p) => ({ ...p, address: undefined }))
                  }}
                  onFocus={() => setAddressOpen(true)}
                  onBlur={() => {
                    restaurantSchema
                      .validateAt('address', { address })
                      .then(() =>
                        setFieldErrors((p) => ({ ...p, address: undefined })),
                      )
                      .catch((err) =>
                        setFieldErrors((p) => ({
                          ...p,
                          address: err.message,
                        })),
                      )
                  }}
                  placeholder="Search Nepal city, area, or district…"
                  autoComplete="off"
                  className={inputClass(fieldErrors.address)}
                />
                {addressOpen && addressSuggestions.length > 0 ? (
                  <ul className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-steam bg-white py-1 shadow-lg">
                    {addressSuggestions.map((place) => (
                      <li key={place}>
                        <button
                          type="button"
                          className="flex w-full items-center px-3.5 py-2.5 text-left text-sm text-espresso hover:bg-cream cursor-pointer"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setAddress(place)
                            setAddressOpen(false)
                            setFieldErrors((p) => ({
                              ...p,
                              address: undefined,
                            }))
                          }}>
                          {place}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-1.5 text-xs text-muted">
                  Pick a Nepal location from suggestions, or type a full address.
                </p>
              </div>
            </Field>

            <Field label={urlLabel} required error={fieldErrors.slug}>
              <div
                className={`rounded-xl border p-4 transition-colors ${
                  isSlugAvailable === false
                    ? 'border-red-300 bg-red-50/50'
                    : isSlugAvailable === true
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-steam bg-cream/40'
                }`}>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={slug}
                    onChange={(e) => {
                      const next = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '')
                      setSlug(next)
                      setSlugTouched(true)
                      setIsSlugAvailable(null)
                      setFieldErrors((p) => ({ ...p, slug: undefined }))
                      setError('')
                    }}
                    placeholder="your-cafe"
                    aria-invalid={isSlugAvailable === false}
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 flex-1 ${
                      isSlugAvailable === false
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : isSlugAvailable === true
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                          : 'border-steam focus:border-coffee focus:ring-coffee/[0.08]'
                    }`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => checkSlugAvailability()}
                      disabled={slugBusy || !slug}
                      className="rounded-xl border border-steam bg-white px-3 py-2 text-xs font-medium text-roast hover:bg-cream disabled:opacity-50 cursor-pointer transition">
                      {slugBusy ? 'Checking…' : 'Check'}
                    </button>
                    <button
                      type="button"
                      onClick={suggestSlugFromName}
                      disabled={slugBusy}
                      className="coffee-fill rounded-xl px-3 py-2 text-xs font-medium text-white disabled:opacity-50 cursor-pointer transition">
                      Suggest
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {slug
                    ? `${slug}.${tenantHostLabel()}`
                    : `your-cafe.${tenantHostLabel()}`}
                </p>
                {slugSuggestions.length > 1 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {slugSuggestions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSlug(option)
                          setSlugTouched(true)
                          setFieldErrors((p) => ({ ...p, slug: undefined }))
                        }}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                          slug === option
                            ? 'coffee-fill border-roast text-white'
                            : 'border-steam bg-white text-roast hover:border-caramel/40'
                        }`}>
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
                {slugBusy && !slugMessage ? (
                  <p className="mt-2 text-xs text-muted">Checking availability…</p>
                ) : null}
                {slugMessage ? (
                  <p
                    role="alert"
                    className={`mt-2 text-xs font-medium ${
                      isSlugAvailable ? 'text-emerald-800' : 'text-red-700'
                    }`}>
                    {isSlugAvailable === false ? '✕ ' : isSlugAvailable ? '✓ ' : ''}
                    {slugMessage}
                  </p>
                ) : null}
                {isSlugAvailable === false ? (
                  <p className="mt-2 text-xs text-red-700">
                    Pick a different URL or click <strong>Suggest</strong> for a
                    shorter available option.
                  </p>
                ) : null}
              </div>
            </Field>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-xl border border-steam py-3 text-sm font-medium text-roast hover:bg-cream cursor-pointer transition">
                Reset
              </button>
              <button
                type="submit"
                disabled={loading || slugBusy || !slug || !isSlugAvailable}
                className="coffee-fill flex-[1.8] rounded-xl text-white py-3 text-sm font-semibold disabled:opacity-50 cursor-pointer transition-all hover:-translate-y-[1px] hover:shadow-lg">
                {loading ? 'Creating…' : 'Create Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

function inputClass(error) {
  return `w-full rounded-xl border bg-milk px-3.5 py-2.5 text-sm outline-none transition-all focus:border-coffee focus:ring-2 focus:ring-coffee/[0.08] ${
    error ? 'border-red-400' : 'border-steam'
  }`
}

function formatSlugTakenMessage(slug, reason) {
  const value = String(slug || '').trim().toLowerCase()
  const base = value ? `${value}.${tenantHostLabel()}` : 'This cafe URL'
  if (!reason) {
    return `${base} is already taken. Try another or click Suggest.`
  }
  if (/reserved/i.test(reason)) {
    return `${base} is reserved. Try another URL.`
  }
  if (/already taken|taken/i.test(reason)) {
    return `${base} is already taken. Try another or click Suggest.`
  }
  return reason
}

function Field({ label, error, required = false, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </label>
  )
}
