'use client'

import {
  clearTrialSession,
  getTrialUser,
  setTrialSession,
  trialFetch,
  markWelcomePending,
  openPosFromTrial,
} from '@/lib/trial-api'
import OnboardBackdrop from '@/components/OnboardBackdrop'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function ChoiceCard({ selected, title, subtitle, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full text-left transition-all duration-300 cursor-pointer rounded-2xl px-6 py-5 border ${
        selected
          ? 'coffee-fill border-roast text-white shadow-2xl shadow-roast/25 scale-[1.01]'
          : 'border-steam bg-white text-espresso hover:border-caramel/40 hover:shadow-lg'
      }`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
          selected ? 'bg-white/15' : 'bg-cream'
        }`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[15px] leading-snug">{title}</div>
          <div className={`mt-0.5 text-sm leading-relaxed ${selected ? 'text-white/60' : 'text-muted'}`}>
            {subtitle}
          </div>
        </div>
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? 'border-white bg-white' : 'border-steam'
        }`}>
          {selected && (
            <svg className="h-3 w-3 text-coffee" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}

export default function GetStartedPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [choice, setChoice] = useState('create')
  const [resumeSetup, setResumeSetup] = useState(false)

  useEffect(() => {
    setResumeSetup(sessionStorage.getItem('serve_resume_setup') === '1')
  }, [])

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
          try {
            await openPosFromTrial()
          } catch {
            router.replace('/login?mode=login')
          }
          return
        }
        setUser(res.data)
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

  const initials = useMemo(() => {
    if (!user) return ''
    return String(user.name || 'U')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  if (!user) {
    return (
      <main className="min-h-screen bg-milk flex items-center justify-center text-muted text-sm">
        Loading…
      </main>
    )
  }

  return (
    <main className="relative min-h-screen onboard-canvas flex items-center justify-center px-4 py-12 overflow-hidden">
      <OnboardBackdrop />
      <div className="relative z-10 w-full max-w-xl onboard-card-in">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => {
              clearTrialSession()
              router.push('/login')
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-steam bg-white hover:bg-cream cursor-pointer transition text-roast">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-coffee" />
            <span className="h-1.5 w-6 rounded-full bg-coffee" />
            <span className="h-1.5 w-6 rounded-full bg-steam" />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white border border-steam shadow-xl shadow-espresso/[0.04] p-8">
          {/* Profile */}
          <div className="flex items-center gap-3 mb-8">
            <div className="coffee-fill flex h-11 w-11 items-center justify-center rounded-full text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-espresso truncate text-sm">{user.name}</p>
              <p className="text-xs text-muted truncate">@{user.username}</p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-syne text-2xl sm:text-[1.7rem] font-800 tracking-[-0.03em] leading-tight text-espresso">
            What would you like to do?
          </h1>
          {resumeSetup ? (
            <p className="mt-3 text-sm text-espresso bg-cream border border-steam rounded-xl px-3 py-2.5 leading-relaxed">
              Welcome back — your account exists, but your cafe is not set up
              yet. Create your restaurant below to finish registration.
            </p>
          ) : null}
          <p className="mt-2 text-muted text-sm leading-relaxed">
            Pick one option. We'll handle the rest in seconds.
          </p>

          {/* Choices */}
          <div className="mt-7 space-y-3">
            <ChoiceCard
              selected={choice === 'create'}
              title="Create New Restaurant"
              subtitle="Start a fresh workspace from scratch."
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M12 8v8" /><path d="M8 12h8" />
                </svg>
              }
              onClick={() => setChoice('create')}
            />
            <ChoiceCard
              selected={choice === 'join'}
              title="Join Existing"
              subtitle="Use an invite code from your team."
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6" /><path d="M23 11h-6" />
                </svg>
              }
              onClick={() => setChoice('join')}
            />
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => {
              if (choice === 'join') {
                alert('Join via invite is coming soon. Create a new restaurant for now.')
                return
              }
              router.push('/create-restaurant')
            }}
            className="coffee-fill mt-8 w-full rounded-xl text-white font-semibold py-3.5 text-sm transition-all duration-200 cursor-pointer hover:-translate-y-[1px] hover:shadow-lg shadow-roast/20">
            {resumeSetup ? 'Continue restaurant setup' : 'Continue'}
          </button>

          <p className="mt-5 text-center text-xs text-muted">
            Already have a cafe?{' '}
            <Link href="/login" className="text-accent font-semibold no-underline hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
