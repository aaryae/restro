'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getTrialUser,
  clearTrialSession,
  setTrialSession,
  trialFetch,
  buildPosEntryUrl,
  shouldShowWelcome,
  openPosFromTrial,
} from '@/lib/trial-api'
import { lanAwareUrl } from '@/lib/public-url'
import {
  getRememberedCafeSlug,
  rememberCafeSlug,
} from '@/lib/cafe-slug'
import OnboardBackdrop from '@/components/OnboardBackdrop'

export default function WelcomePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [pos, setPos] = useState(null)
  const [opening, setOpening] = useState(false)
  const [openError, setOpenError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      const u = getTrialUser()
      if (!u?.token) {
        router.replace('/login?mode=login')
        return
      }

      if (!shouldShowWelcome()) {
        try {
          await openPosFromTrial()
        } catch {
          router.replace('/login?mode=login')
        }
        return
      }

      try {
        const res = await trialFetch('/trial/me', { auth: true })
        if (cancelled) return
        setTrialSession(res.data)
        if (!res.data.tenantId && !res.data.tenant) {
          router.replace('/get-started')
          return
        }
        setUser(res.data)
      } catch {
        if (cancelled) return
        // Stale browser session (e.g. cafe deleted) — clear and show login
        clearTrialSession()
        router.replace('/login?mode=login')
        return
      }

      try {
        setPos(JSON.parse(sessionStorage.getItem('serve_pos_bootstrap') || 'null'))
      } catch {
        setPos(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!user) {
    return (
      <main className="min-h-screen bg-milk flex items-center justify-center text-muted text-sm">
        Loading…
      </main>
    )
  }

  const restaurant = user.restaurant || user.tenant || {}
  const displayName = String(user.name || 'there').trim() || 'there'
  const cafeSlug =
    restaurant.slug || pos?.tenantSlug || getRememberedCafeSlug()

  async function openPos() {
    if (!cafeSlug || opening) return
    setOpenError('')
    setOpening(true)
    rememberCafeSlug(cafeSlug)

    try {
      let url = pos?.url
      if (!url) {
        const token = pos?.token
        if (token) {
          url = buildPosEntryUrl(cafeSlug, token)
        }
      }
      if (!url) {
        const res = await trialFetch('/trial/pos-bootstrap', { auth: true })
        url = res.data?.pos?.url
        if (res.data?.pos) {
          sessionStorage.setItem(
            'serve_pos_bootstrap',
            JSON.stringify(res.data.pos),
          )
        }
      }
      if (!url) {
        throw new Error('Could not open your cafe. Try again.')
      }
      window.location.href = lanAwareUrl(url)
    } catch (err) {
      setOpenError(err.message || 'Could not open your cafe.')
      setOpening(false)
    }
  }

  return (
    <main className="relative min-h-screen onboard-canvas overflow-hidden">
      <OnboardBackdrop />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-steam bg-white/95 text-ink shadow-xl shadow-espresso/[0.10] px-7 py-8 text-center backdrop-blur-sm">
          <p className="text-sm text-muted">Hello, {displayName}</p>
          <h1 className="mt-2 font-syne text-3xl font-800 text-espresso">
            Welcome to Serve
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            Your restaurant has been successfully created
            {restaurant.name ? (
              <>
                {' '}
                (<span className="text-espresso font-medium">{restaurant.name}</span>)
              </>
            ) : null}
            . Take a quick look at how easy it is to manage your menu, tables, and team.
          </p>

          {cafeSlug ? (
            <p className="mt-4 text-xs text-muted">
              Trial cafe URL:{' '}
              <span className="font-medium text-espresso">
                {cafeSlug}.servecafe.app
              </span>
            </p>
          ) : null}

          {restaurant.trialEndsAt || user.tenant?.trialEndsAt ? (
            <p className="mt-2 text-xs text-muted">
              Free trial until{' '}
              <span className="font-medium text-espresso">
                {new Date(
                  restaurant.trialEndsAt || user.tenant.trialEndsAt,
                ).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {' '}(14 days)
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">14-day free trial — no card required.</p>
          )}

          {openError ? (
            <p className="mt-4 text-sm text-[#9b2c2c]">{openError}</p>
          ) : null}

          <button
            type="button"
            onClick={openPos}
            disabled={!cafeSlug || opening}
            className="coffee-fill mt-6 w-full rounded-xl text-white font-semibold py-3.5 transition hover:-translate-y-[1px] hover:shadow-lg shadow-roast/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {opening ? 'Opening your cafe…' : "Let's Continue"}
          </button>

          <button
            type="button"
            onClick={() => {
              clearTrialSession()
              router.push('/login?mode=login')
            }}
            className="mt-3 w-full text-sm text-muted hover:text-espresso py-2">
            Sign out
          </button>
        </div>
      </div>
    </main>
  )
}
