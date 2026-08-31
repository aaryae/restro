'use client'

import { useEffect, useState } from 'react'
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
import OnboardBackdrop from '@/components/OnboardBackdrop'

const restaurantSchema = yup.object({
  name: yup.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').required('Restaurant name is required'),
  phone: yup.string().matches(/^\d{7,10}$/, 'Enter a valid phone number (7-10 digits)').required('Phone number is required'),
  address: yup.string().trim().min(3, 'Address must be at least 3 characters').required('Address is required'),
  slug: yup.string().trim().min(3, 'URL must be at least 3 characters').matches(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and dashes').required('Cafe URL is required'),
})

const TYPES = [
  'FastFood',
  'Resort',
  'Hotel',
  'Bakery',
  'Cloud Kitchen',
  'Bar',
  'Cafe',
  'Restaurant',
]

export default function CreateRestaurantPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [businessType, setBusinessType] = useState('Cafe')
  const [address, setAddress] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugMessage, setSlugMessage] = useState('')
  const [isSlugAvailable, setIsSlugAvailable] = useState(null)
  const [slugBusy, setSlugBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

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
    if (!name.trim() || slugTouched) return
    const t = setTimeout(async () => {
      try {
        setSlugBusy(true)
        const res = await trialFetch(`/trial/suggest-slug?name=${encodeURIComponent(name)}`)
        const next = res.data?.slug || ''
        setSlug(next)
        setIsSlugAvailable(true)
        setSlugMessage(next ? `${next}.servecafe.app is available.` : '')
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
        const res = await trialFetch(`/trial/slug-available?slug=${encodeURIComponent(value)}`)
        if (cancelled) return
        const payload = res.data || {}
        setIsSlugAvailable(Boolean(payload.available))
        setSlugMessage(
          payload.available
            ? `${value}.servecafe.app is available.`
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
      return false
    }
    if (value.length < 3) {
      setIsSlugAvailable(false)
      setSlugMessage('URL must be at least 3 characters.')
      return false
    }
    setSlugBusy(true)
    try {
      const res = await trialFetch(`/trial/slug-available?slug=${encodeURIComponent(value)}`)
      const payload = res.data || {}
      setSlug(value)
      const available = Boolean(payload.available)
      setIsSlugAvailable(available)
      const message = available
        ? `${value}.servecafe.app is available.`
        : formatSlugTakenMessage(value, payload.reason)
      setSlugMessage(message)
      setFieldErrors((prev) => ({ ...prev, slug: undefined }))
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
      return
    }
    setSlugBusy(true)
    try {
      const res = await trialFetch(`/trial/suggest-slug?name=${encodeURIComponent(name)}`)
      const next = res.data.slug || ''
      setSlug(next)
      setSlugTouched(true)
      setIsSlugAvailable(true)
      setSlugMessage(`${next}.servecafe.app is available.`)
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
    setSlug('')
    setSlugTouched(false)
    setSlugMessage('')
    setIsSlugAvailable(null)
    setError('')
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    try {
      await restaurantSchema.validate({ name, phone, address, slug }, { abortEarly: false })
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
      const pendingPassword = sessionStorage.getItem('serve_pending_password')
      const res = await trialFetch('/trial/restaurants', {
        method: 'POST',
        auth: true,
        body: { name, phone, businessType, address, slug, password: pendingPassword || undefined },
      })
      const merged = { ...res.data, token: res.data.token }
      setTrialSession(merged)
      rememberCafeSlug(slug || res.data.tenant?.slug || res.data.slug)
      if (res.data.pos) sessionStorage.setItem('serve_pos_bootstrap', JSON.stringify(res.data.pos))
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
        setError(slugMsg)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen onboard-canvas flex items-center justify-center px-4 py-10 overflow-hidden">
      <OnboardBackdrop />
      <div className="relative z-10 w-full max-w-2xl onboard-card-in">
        {/* Top bar */}
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

        {/* Card */}
        <div className="rounded-3xl bg-white border border-steam shadow-xl shadow-espresso/[0.04] p-7 sm:p-9">
          <h1 className="font-syne text-xl sm:text-2xl font-800 tracking-[-0.02em] text-espresso">
            Set up your restaurant
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Takes 30 seconds. You can change these later.
          </p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
            <Field label="Restaurant Name" error={fieldErrors.name}>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({...p, name: undefined})) }}
                placeholder="e.g. Amechi Cafe"
                className={`w-full rounded-xl border bg-milk px-3.5 py-2.5 text-sm outline-none transition-all focus:border-coffee focus:ring-2 focus:ring-coffee/[0.08] ${fieldErrors.name ? 'border-red-400' : 'border-steam'}`}
              />
            </Field>

            <Field label="Phone" error={fieldErrors.phone}>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-xl border border-steam bg-cream px-3 text-sm text-roast">
                  +977
                </span>
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFieldErrors(p => ({...p, phone: undefined})) }}
                  placeholder="98XXXXXXXX"
                  className={`w-full rounded-xl border bg-milk px-3.5 py-2.5 text-sm outline-none transition-all focus:border-coffee focus:ring-2 focus:ring-coffee/[0.08] flex-1 ${fieldErrors.phone ? 'border-red-400' : 'border-steam'}`}
                />
              </div>
            </Field>

            <Field label="Type">
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBusinessType(t)}
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

            <Field label="Address" error={fieldErrors.address}>
              <input
                value={address}
                onChange={(e) => { setAddress(e.target.value); setFieldErrors(p => ({...p, address: undefined})) }}
                placeholder="Location"
                className={`w-full rounded-xl border bg-milk px-3.5 py-2.5 text-sm outline-none transition-all focus:border-coffee focus:ring-2 focus:ring-coffee/[0.08] ${fieldErrors.address ? 'border-red-400' : 'border-steam'}`}
              />
            </Field>

            <Field label="Cafe URL">
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
                    required
                    value={slug}
                    onChange={(e) => {
                      const next = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
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
                  {slug ? `${slug}.servecafe.app` : 'your-cafe.servecafe.app'}
                </p>
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
                    Pick a different URL or click <strong>Suggest</strong> for an available option.
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

function formatSlugTakenMessage(slug, reason) {
  const value = String(slug || '').trim().toLowerCase()
  const base = value ? `${value}.servecafe.app` : 'This cafe URL'
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

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </label>
  )
}
