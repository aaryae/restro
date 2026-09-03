'use client'

import {
  clearTrialSession,
  getTrialUser,
  GOOGLE_CLIENT_ID,
  openPosFromTrial,
  setTrialSession,
  trialFetch,
} from '@/lib/trial-api'
import {
  loginSchema,
  registerSchema,
  otpSchema,
  forgotSchema,
  resetPasswordSchema,
  validateField,
  validateForm,
} from '@/lib/login-validation'
import {
  CAFE_HOST_LABEL,
  getRememberedCafeSlug,
  rememberCafeSlug,
  sanitizeCafeSlugInput,
  normalizeCafeSlug,
} from '@/lib/cafe-slug'
import BlackToast from '@/components/BlackToast'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Google only allows one initialize() per page load — guard at module scope. */
let gsiInitialized = false

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-milk flex items-center justify-center text-muted text-sm">
          Loading…
        </main>
      }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'login' ? 'login' : 'register'
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [cafeSlug, setCafeSlug] = useState('')
  const [email, setEmail] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpPending, setOtpPending] = useState(null)
  const [resetStep, setResetStep] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [toast, setToast] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState(null)

  const [googleReady, setGoogleReady] = useState(false)
  const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false)
  const onGoogleCredentialRef = useRef(null)
  const googleBtnRef = useCallback((node) => {
    if (node) node.dataset.mount = '1'
  }, [])

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGsiScriptLoaded(true)
    }
  }, [])

  useEffect(() => {
    setExisting(getTrialUser())
    setCafeSlug(getRememberedCafeSlug())
  }, [])

  const copy = useMemo(() => {
    if (resetStep === 'confirm') {
      return {
        badge: 'Reset password',
        title: 'Enter the code we emailed',
        sub: 'Use the 6-digit code sent to the email on this account, then choose a new password.',
        cta: 'Update password',
        footer: 'Remembered it?',
        footerAction: 'Back to sign in',
        otherMode: 'login',
      }
    }
    if (resetStep === 'request') {
      return {
        badge: 'Reset password',
        title: 'Forgot your password?',
        sub: 'Enter the username or email you sign in with. If that account exists, we will email a reset code.',
        cta: 'Send reset code',
        footer: 'Remembered it?',
        footerAction: 'Back to sign in',
        otherMode: 'login',
      }
    }
    if (mode === 'register') {
      return {
        badge: 'Start your trial',
        title: (
          <>
            Create your <span className="text-accent">Serve</span> account
          </>
        ),
        sub: 'Get POS, KOT, and floor tools ready in minutes.',
        cta: 'Create account',
        footer: 'Already have an account?',
        footerAction: 'Sign in',
        otherMode: 'login',
      }
    }
    return {
      badge: 'Welcome back',
      title: 'Sign in to your cafe',
      sub: 'Continue setup or jump back into your floor.',
      cta: 'Sign in',
      footer: 'New here?',
      footerAction: 'Create an account',
      otherMode: 'register',
    }
  }, [mode, resetStep])

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function switchMode(nextMode) {
    if (nextMode === mode) return
    setToast('')
    setFieldErrors({})
    setOtpPending(null)
    setOtp('')
    setResetStep(null)
    setNewPassword('')
    setConfirmPassword('')
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', nextMode)
    router.replace(`/login?${params.toString()}`, { scroll: false })
  }

  function startForgotPassword() {
    setToast('')
    setFieldErrors({})
    setOtpPending(null)
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setResetStep('request')
  }

  function leaveForgotPassword() {
    setToast('')
    setFieldErrors({})
    setOtpPending(null)
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setResetStep(null)
  }

  function sanitizeUsernameInput(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 30)
  }

  async function finish(data, pendingPassword = password) {
    if (data?.needsOtp) {
      setOtpPending({
        email: data.email,
        username: data.username,
      })
      setOtp('')
      setToast(data.message || 'Enter the verification code sent to your email')
      setLoading(false)
      return
    }

    setOtpPending(null)
    setTrialSession(data)

    const accountSlug =
      data?.tenant?.slug || data?.restaurant?.slug || data?.slug || ''
    const hasTenant = !!(
      data.tenantId ||
      data.tenant?.id ||
      data.restaurant?.id
    )
    // Only for first-time cafe setup: POS owner password is copied at provision.
    // Never stash a password if the cafe already exists (XSS can read sessionStorage).
    if (!hasTenant && pendingPassword) {
      sessionStorage.setItem('serve_pending_password', pendingPassword)
    } else {
      sessionStorage.removeItem('serve_pending_password')
    }

    const enteredSlug = normalizeCafeSlug(cafeSlug)

    if (hasTenant) {
      if (enteredSlug && accountSlug && enteredSlug !== accountSlug) {
        setToast(
          `"${enteredSlug}" doesn't match your account. Opening ${accountSlug} instead.`,
        )
      }
      rememberCafeSlug(accountSlug || enteredSlug)
    } else if (enteredSlug) {
      rememberCafeSlug(enteredSlug)
    }

    if (!hasTenant) {
      sessionStorage.setItem('serve_resume_setup', '1')
      router.push('/get-started')
      return
    }

    sessionStorage.removeItem('serve_resume_setup')
    setLoading(true)
    try {
      await openPosFromTrial()
    } catch (err) {
      setToast(err.message)
      setLoading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setToast('')
    setFieldErrors({})

    if (resetStep === 'request') {
      const result = await validateForm(forgotSchema, { login: loginId })
      if (!result.ok) {
        setFieldErrors(result.errors)
        const first = Object.values(result.errors)[0]
        if (first) setToast(first)
        return
      }

      setLoading(true)
      try {
        const res = await trialFetch('/trial/forgot-password', {
          method: 'POST',
          body: { login: result.data.login },
        })
        setLoginId(result.data.login)
        setResetStep('confirm')
        setToast(res.message || 'If an account exists, we sent a reset code')
      } catch (err) {
        setToast(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    if (resetStep === 'confirm') {
      const result = await validateForm(resetPasswordSchema, {
        login: loginId,
        otp,
        newPassword,
        confirmPassword,
      })
      if (!result.ok) {
        setFieldErrors(result.errors)
        const first = Object.values(result.errors)[0]
        if (first) setToast(first)
        return
      }

      setLoading(true)
      try {
        const res = await trialFetch('/trial/reset-password', {
          method: 'POST',
          body: {
            login: result.data.login,
            otp: result.data.otp,
            newPassword: result.data.newPassword,
          },
        })
        setNewPassword('')
        setConfirmPassword('')
        setOtp('')
        await finish(res.data, result.data.newPassword)
      } catch (err) {
        setToast(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    if (otpPending) {
      const result = await validateForm(otpSchema, { otp })
      if (!result.ok) {
        setFieldErrors(result.errors)
        const first = Object.values(result.errors)[0]
        if (first) setToast(first)
        return
      }

      setLoading(true)
      try {
        const res = await trialFetch('/trial/verify-otp', {
          method: 'POST',
          body: {
            otp: result.data.otp,
            email: otpPending.email,
            username: otpPending.username,
          },
        })
        await finish(res.data)
      } catch (err) {
        setToast(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    const schema = mode === 'register' ? registerSchema : loginSchema
    const values =
      mode === 'register'
        ? { name, username, email, password }
        : { cafeSlug, login: loginId, password }

    const result = await validateForm(schema, values)
    if (!result.ok) {
      setFieldErrors(result.errors)
      const first = Object.values(result.errors)[0]
      if (first) setToast(first)
      return
    }

    setLoading(true)
    try {
      const path = mode === 'register' ? '/trial/register' : '/trial/login'
      const body =
        mode === 'register'
          ? result.data
          : {
              login: result.data.login,
              password: result.data.password,
            }
      const res = await trialFetch(path, { method: 'POST', body })
      if (res.data?.needsOtp) {
        setToast(res.message || 'Check your email for the verification code')
      }
      await finish(res.data)
    } catch (err) {
      setToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onResendOtp() {
    if (resetStep === 'confirm') {
      setToast('')
      setLoading(true)
      try {
        const res = await trialFetch('/trial/forgot-password', {
          method: 'POST',
          body: { login: loginId },
        })
        setToast(res.message || 'If an account exists, we sent a reset code')
      } catch (err) {
        setToast(err.message)
      } finally {
        setLoading(false)
      }
      return
    }

    if (!otpPending) return
    setToast('')
    setLoading(true)
    try {
      const res = await trialFetch('/trial/resend-otp', {
        method: 'POST',
        body: {
          email: otpPending.email,
          username: otpPending.username,
        },
      })
      setToast(res.message || 'A new code was sent')
      if (res.data?.email) {
        setOtpPending({
          email: res.data.email,
          username: res.data.username,
        })
      }
    } catch (err) {
      setToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onGoogleCredential(response) {
    setToast('')
    setLoading(true)
    try {
      const res = await trialFetch('/trial/google', {
        method: 'POST',
        body: { credential: response.credential },
      })
      await finish(res.data)
    } catch (err) {
      setToast(err.message)
    } finally {
      setLoading(false)
    }
  }

  onGoogleCredentialRef.current = onGoogleCredential

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !gsiScriptLoaded) return undefined

    let cancelled = false

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id) return false
      const el = document.getElementById('google-btn')
      if (!el) return false

      if (!gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onGoogleCredentialRef.current(response),
        })
        gsiInitialized = true
      }

      el.innerHTML = ''
      const width = Math.min(400, Math.max(280, el.offsetWidth || 400))

      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        width,
        text: 'continue_with',
        shape: 'pill',
      })
      setGoogleReady(true)
      return true
    }

    if (renderButton()) {
      return () => {
        cancelled = true
      }
    }

    const timer = setInterval(() => {
      if (renderButton()) clearInterval(timer)
    }, 200)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [GOOGLE_CLIENT_ID, gsiScriptLoaded])

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-milk text-ink">
      <BlackToast message={toast} onClose={() => setToast('')} />
      {GOOGLE_CLIENT_ID ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGsiScriptLoaded(true)}
        />
      ) : null}

      {/* Left — brand panel; min-w-0 + fluid type so mid widths don't clip */}
      <aside className="relative hidden min-w-0 lg:flex flex-col justify-between overflow-hidden bg-espresso text-cream px-8 py-8 pl-10 xl:px-12 xl:py-12 xl:pl-16 2xl:px-16 2xl:pl-[8.125rem]">
        <div className="login-glow" aria-hidden />
        <div className="login-steam" aria-hidden />
        <div className="login-grain" aria-hidden />

        <Link
          href="/"
          className="relative z-10 inline-flex h-fit w-fit leading-none no-underline">
          <Image
            src="/logo-tight.png"
            alt="SERVE"
            width={916}
            height={444}
            className="logo-invert block h-12 xl:h-16 2xl:h-20 w-auto max-w-[min(220px,100%)]"
            priority
          />
        </Link>

        <div className="relative z-10 w-full min-w-0 max-w-2xl -translate-y-4 xl:-translate-y-14 2xl:-translate-y-16">
          <p className="font-dmono text-[0.7rem] tracking-[0.2em] uppercase text-accent mb-4 xl:mb-5">
            Cafe management · Nepal
          </p>
          <h1 className="font-syne font-extrabold tracking-[-0.04em] leading-[1.02] text-[clamp(2.15rem,calc(2.4vw+1.1rem),4.85rem)]">
            Less
            <span className="block text-cream/40">chaos. More cups.</span>
            <span className="block">More control.</span>
            <span className="block">Serve.</span>
          </h1>
          <p className="mt-4 xl:mt-6 text-cream/65 text-sm xl:text-base leading-relaxed max-w-sm font-light">
            POS, KOT, tables, and team — built for cafes that run on rhythm, not
            spreadsheets.
          </p>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-6">
          <p className="font-dmono text-[0.72rem] tracking-wider uppercase text-white">
            Trial · 14 days · No card
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="login-dot h-1.5 w-1.5 rounded-full bg-accent/80"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Right — current login form */}
      <section className="relative min-h-screen min-w-0 overflow-hidden flex flex-col">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[520, 800].map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border border-caramel/10"
              style={{
                width: size,
                height: size,
                top: -size / 3,
                right: -size / 3,
                opacity: 1 - i * 0.3,
              }}
            />
          ))}
          <div
            className="absolute bottom-0 right-0 w-[420px] h-[420px]"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(196,118,58,0.16) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              WebkitMaskImage:
                'radial-gradient(ellipse at bottom right, black 20%, transparent 70%)',
              maskImage:
                'radial-gradient(ellipse at bottom right, black 20%, transparent 70%)',
            }}
          />
        </div>

        <header className="relative z-20 flex items-center justify-between pl-10 pr-6 sm:pl-16 sm:pr-10 xl:pl-24 xl:pr-14 py-5">
          <Link href="/" className="lg:hidden inline-flex no-underline">
            <Image
              src="/logo.png"
              alt="SERVE"
              width={110}
              height={44}
              className="logo-blend h-9 w-auto"
              priority
            />
          </Link>
          <div className="hidden lg:block" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-espresso transition-colors ml-auto cursor-pointer leading-none">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to site
          </Link>
        </header>

        <div className="relative z-10 flex-1 flex flex-col justify-center items-start pl-10 pr-6 sm:pl-16 sm:pr-10 xl:pl-24 xl:pr-14 pb-12 pt-2">
          <div className="max-w-[460px] w-full text-left">
            <div className="login-fade inline-flex items-center gap-2 bg-caramel/10 border border-caramel/25 px-4 py-[6px] rounded-full text-[0.82rem] font-medium text-caramel mb-4 tracking-wide">
              <span className="w-[6px] h-[6px] bg-accent rounded-full login-blink" />
              <span className="inline-block min-w-[7.5rem] transition-opacity duration-300">
                {copy.badge}
              </span>
            </div>

            <div className="relative min-h-[2.8rem] mb-2">
              <h2
                key={mode + String(resetStep || '') + '-title'}
                className="font-syne text-[clamp(1.85rem,3.5vw,2.45rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-ink login-mode-fade">
                {copy.title}
              </h2>
            </div>

            <p
              key={mode + String(resetStep || '') + '-sub'}
              className="text-[0.95rem] text-muted leading-relaxed mb-5 font-light min-h-[2.4rem] login-mode-fade">
              {copy.sub}
            </p>

            {existing?.token ? (
              <div className="mb-5 flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-sm">
                <span className="text-espresso">
                  Signed in as{' '}
                  <strong>{existing.name || existing.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const hasTenant = !!(
                      existing.tenantId ||
                      existing.tenant ||
                      existing.restaurant
                    )
                    if (!hasTenant) {
                      router.push('/get-started')
                      return
                    }
                    setLoading(true)
                    try {
                      await openPosFromTrial()
                    } catch (err) {
                      setToast(err.message)
                      setLoading(false)
                    }
                  }}
                  className="font-medium text-accent hover:text-accent-dark cursor-pointer">
                  Continue →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearTrialSession()
                    setExisting(null)
                  }}
                  className="text-muted hover:text-espresso cursor-pointer">
                  Sign out
                </button>
              </div>
            ) : null}

            {/* Sliding mode switch — symmetric padding both sides */}
            {!otpPending && !resetStep ? (
            <div
              role="tablist"
              className="relative mb-5 grid grid-cols-2 p-1 rounded-full bg-[#efe7dc] w-full max-w-[300px]">
              <span
                aria-hidden
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.5rem)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  mode === 'login'
                    ? 'translate-x-[calc(100%+0.5rem)]'
                    : 'translate-x-0'
                }`}
              />
              {[
                { id: 'register', label: 'Register' },
                { id: 'login', label: 'Login' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab.id}
                  onClick={() => switchMode(tab.id)}
                  className={`relative z-10 py-2.5 text-sm font-medium cursor-pointer transition-colors duration-300 text-center ${
                    mode === tab.id
                      ? 'text-espresso'
                      : 'text-muted hover:text-roast'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            ) : (
              <div className="mb-5">
                <p className="text-sm font-medium text-espresso">
                  {resetStep === 'confirm'
                    ? 'Check your email'
                    : resetStep === 'request'
                      ? 'Find your account'
                      : 'Verify your email'}
                </p>
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-2 text-left">
              {resetStep === 'confirm' ? (
                <>
                  <p className="mb-1 text-sm text-muted">
                    {loginId.includes('@') ? (
                      <>
                        We sent a 6-digit code to{' '}
                        <span className="font-medium text-espresso">{loginId}</span>
                        . Enter it with your new password.
                      </>
                    ) : (
                      <>
                        If <span className="font-medium text-espresso">{loginId}</span>{' '}
                        is a Serve account, we emailed a 6-digit code to the address
                        on file. Enter it with your new password.
                      </>
                    )}
                  </p>
                  <Field
                    label="Reset code"
                    name="otp"
                    value={otp}
                    onChange={(v) => {
                      setOtp(v.replace(/\D/g, '').slice(0, 6))
                      clearFieldError('otp')
                    }}
                    error={fieldErrors.otp}
                    placeholder="123456"
                    autoComplete="one-time-code"
                  />
                  <Field
                    label="New password"
                    name="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(v) => {
                      setNewPassword(v)
                      clearFieldError('newPassword')
                    }}
                    onBlur={() => {
                      validateField(resetPasswordSchema, 'newPassword', {
                        login: loginId,
                        otp,
                        newPassword,
                        confirmPassword,
                      }).then((message) => {
                        if (message) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            newPassword: message,
                          }))
                        }
                      })
                    }}
                    error={fieldErrors.newPassword}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-espresso cursor-pointer">
                        {showNewPw ? 'Hide' : 'Show'}
                      </button>
                    }
                  />
                  <Field
                    label="Confirm new password"
                    name="confirmPassword"
                    type={showNewPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(v) => {
                      setConfirmPassword(v)
                      clearFieldError('confirmPassword')
                    }}
                    error={fieldErrors.confirmPassword}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-espresso text-cream font-medium py-3.5 px-6 text-base cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:bg-coffee hover:shadow-[0_10px_32px_rgba(26,15,10,0.28)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                    {loading ? 'Please wait…' : copy.cta}
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={onResendOtp}
                      className="text-espresso font-medium underline-offset-2 hover:underline cursor-pointer disabled:opacity-60">
                      Resend code
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={leaveForgotPassword}
                      className="text-muted hover:text-espresso cursor-pointer">
                      Back to sign in
                    </button>
                  </div>
                </>
              ) : otpPending ? (
                <>
                  <p className="mb-1 text-sm text-muted">
                    We sent a 6-digit code to{' '}
                    <span className="font-medium text-espresso">
                      {otpPending.email}
                    </span>
                    . Enter it below to finish.
                  </p>
                  <Field
                    label="Verification code"
                    name="otp"
                    value={otp}
                    onChange={(v) => {
                      setOtp(v.replace(/\D/g, '').slice(0, 6))
                      clearFieldError('otp')
                    }}
                    error={fieldErrors.otp}
                    placeholder="123456"
                    autoComplete="one-time-code"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-espresso text-cream font-medium py-3.5 px-6 text-base cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:bg-coffee hover:shadow-[0_10px_32px_rgba(26,15,10,0.28)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                    {loading ? 'Please wait…' : 'Verify and continue'}
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={onResendOtp}
                      className="text-espresso font-medium underline-offset-2 hover:underline cursor-pointer disabled:opacity-60">
                      Resend code
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setOtpPending(null)
                        setOtp('')
                        setToast('')
                      }}
                      className="text-muted hover:text-espresso cursor-pointer">
                      Back
                    </button>
                  </div>
                </>
              ) : (
                <>
              {/* Name collapses smoothly — no hard snap between modes */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  mode === 'register' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}>
                <div className="overflow-hidden min-h-0">
                  <div
                    className={`pb-2 transition-opacity duration-300 ${
                      mode === 'register' ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <Field
                      label="Your name"
                      name="name"
                      value={name}
                      onChange={(v) => {
                        setName(v)
                        clearFieldError('name')
                      }}
                      onBlur={() => {
                        if (mode !== 'register') return
                        validateField(registerSchema, 'name', {
                          name,
                          username,
                          email,
                          password,
                        }).then((message) => {
                          if (message) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              name: message,
                            }))
                          }
                        })
                      }}
                      error={fieldErrors.name}
                      placeholder="Aarya Dangol"
                      autoComplete="name"
                      disabled={mode !== 'register'}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  mode === 'register' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}>
                <div className="overflow-hidden min-h-0">
                  <div
                    className={`pb-2 transition-opacity duration-300 ${
                      mode === 'register' ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <Field
                      label="Username"
                      name="username"
                      value={username}
                      onChange={(v) => {
                        setUsername(sanitizeUsernameInput(v))
                        clearFieldError('username')
                      }}
                      onBlur={() => {
                        if (mode !== 'register') return
                        validateField(registerSchema, 'username', {
                          name,
                          username,
                          email,
                          password,
                        }).then((message) => {
                          if (message) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              username: message,
                            }))
                          }
                        })
                      }}
                      error={fieldErrors.username}
                      placeholder="aarya"
                      autoComplete="username"
                      disabled={mode !== 'register'}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  mode === 'login' && !resetStep ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}>
                <div className="overflow-hidden min-h-0">
                  <div
                    className={`pb-2 transition-opacity duration-300 ${
                      mode === 'login' ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <CafeSlugField
                      value={cafeSlug}
                      error={fieldErrors.cafeSlug}
                      disabled={mode !== 'login' || Boolean(resetStep)}
                      onChange={(v) => {
                        setCafeSlug(sanitizeCafeSlugInput(v))
                        clearFieldError('cafeSlug')
                      }}
                      onBlur={() => {
                        if (mode !== 'login') return
                        validateField(loginSchema, 'cafeSlug', {
                          cafeSlug,
                          login: loginId,
                          password,
                        }).then((message) => {
                          if (message) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              cafeSlug: message,
                            }))
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              </div>

              {mode === 'register' ? (
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(v) => {
                    setEmail(v)
                    clearFieldError('email')
                  }}
                  onBlur={() => {
                    validateField(registerSchema, 'email', {
                      name,
                      username,
                      email,
                      password,
                    }).then((message) => {
                      if (message) {
                        setFieldErrors((prev) => ({ ...prev, email: message }))
                      }
                    })
                  }}
                  error={fieldErrors.email}
                  placeholder="you@cafe.com"
                  autoComplete="email"
                />
              ) : (
                <Field
                  label="Username or email"
                  name="login"
                  type="text"
                  value={loginId}
                  onChange={(v) => {
                    setLoginId(v)
                    clearFieldError('login')
                  }}
                  onBlur={() => {
                    validateField(loginSchema, 'login', {
                      cafeSlug,
                      login: loginId,
                      password,
                    }).then((message) => {
                      if (message) {
                        setFieldErrors((prev) => ({ ...prev, login: message }))
                      }
                    })
                  }}
                  error={fieldErrors.login}
                  placeholder="aarya or you@cafe.com"
                  autoComplete="username"
                />
              )}

              {resetStep !== 'request' ? (
              <Field
                label="Password"
                name="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(v) => {
                  setPassword(v)
                  clearFieldError('password')
                }}
                onBlur={() => {
                  const schema = mode === 'register' ? registerSchema : loginSchema
                  const values =
                    mode === 'register'
                      ? { name, username, email, password }
                      : { cafeSlug, login: loginId, password }
                  validateField(schema, 'password', values).then((message) => {
                    if (message) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: message,
                      }))
                    }
                  })
                }}
                error={fieldErrors.password}
                placeholder="At least 6 characters"
                autoComplete={
                  mode === 'register' ? 'new-password' : 'current-password'
                }
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-espresso cursor-pointer">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                }
              />
              ) : null}

              {mode === 'login' && !resetStep ? (
                <div className="-mt-1 mb-1 flex justify-end">
                  <button
                    type="button"
                    onClick={startForgotPassword}
                    className="text-xs font-medium text-muted hover:text-espresso underline-offset-2 hover:underline cursor-pointer">
                    Forgot password?
                  </button>
                </div>
              ) : null}

              {resetStep === 'request' ? (
                <p className="text-xs text-muted leading-relaxed">
                  Signed up with Google? Use Continue with Google on the sign-in
                  page instead.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-espresso text-cream font-medium py-3.5 px-6 text-base cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:bg-coffee hover:shadow-[0_10px_32px_rgba(26,15,10,0.28)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                {loading ? 'Please wait…' : copy.cta}
                {!loading ? (
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                ) : null}
              </button>
                </>
              )}
            </form>

            {!otpPending && !resetStep && GOOGLE_CLIENT_ID ? (
              <div className="mt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-caramel/20" />
                  <span className="text-xs text-muted shrink-0">or</span>
                  <div className="flex-1 h-px bg-caramel/20" />
                </div>

                <div className="relative w-full min-h-[48px]">
                  {!googleReady ? (
                    <div
                      aria-hidden
                      className="absolute inset-0 flex items-center justify-center gap-2.5 rounded-full border border-caramel/25 bg-white text-sm font-medium text-roast shadow-sm">
                      <GoogleIcon />
                      Continue with Google
                    </div>
                  ) : null}
                  <div
                    id="google-btn"
                    ref={googleBtnRef}
                    className={`w-full flex justify-center cursor-pointer ${googleReady ? '' : 'opacity-0'}`}
                  />
                </div>
              </div>
            ) : null}

            {!otpPending && resetStep !== 'confirm' ? (
            <p className="mt-5 text-sm text-muted">
              {copy.footer}{' '}
              <button
                type="button"
                onClick={() =>
                  resetStep ? leaveForgotPassword() : switchMode(copy.otherMode)
                }
                className="text-espresso font-medium underline-offset-2 hover:underline cursor-pointer">
                {copy.footerAction}
              </button>
            </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function CafeSlugField({ value, onChange, onBlur, error, disabled = false }) {
  const invalid = Boolean(error)

  return (
    <label className={`block ${disabled ? 'pointer-events-none' : ''}`}>
      <span className="text-[0.8rem] font-medium text-roast">
        Your cafe <span className="font-normal text-muted">(optional)</span>
      </span>
      <div
        className={`mt-1 flex items-stretch overflow-hidden rounded-2xl border bg-white shadow-[0_1px_0_rgba(26,15,10,0.03)] transition focus-within:ring-4 ${
          invalid
            ? 'border-[#e53e3e] focus-within:border-[#e53e3e] focus-within:ring-[#e53e3e]/15'
            : 'border-caramel/20 focus-within:border-accent focus-within:ring-accent/15'
        }`}>
        <input
          name="cafeSlug"
          disabled={disabled}
          type="text"
          inputMode="url"
          spellCheck="false"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="organization"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="your-cafe"
          tabIndex={disabled ? -1 : undefined}
          aria-invalid={invalid ? 'true' : undefined}
          aria-describedby={invalid ? 'cafeSlug-error' : 'cafeSlug-hint'}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-[0.95rem] text-espresso outline-none placeholder:text-muted/50 disabled:bg-transparent"
        />
        <span className="flex shrink-0 items-center border-l border-caramel/20 bg-cream/50 px-3 text-[0.82rem] text-muted select-none">
          .{CAFE_HOST_LABEL}
        </span>
      </div>
      {error ? (
        <p id="cafeSlug-error" className="mt-1.5 text-xs text-[#c53030]">
          {error}
        </p>
      ) : (
        <p id="cafeSlug-hint" className="mt-1.5 text-xs text-muted">
          Leave blank if you have not created your cafe yet — sign in with
          username or email and we will continue setup. If you already have a
          cafe, enter its ID to open it faster.
        </p>
      )}
    </label>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = 'text',
  autoComplete,
  disabled = false,
  endAdornment,
}) {
  const inputClass = `mt-1 w-full rounded-2xl border bg-white px-4 py-3 text-[0.95rem] text-espresso shadow-[0_1px_0_rgba(26,15,10,0.03)] outline-none transition focus:ring-4 placeholder:text-muted/50 disabled:bg-transparent ${
    endAdornment ? 'pr-14' : ''
  } ${
    error
      ? 'border-[#e53e3e] focus:border-[#e53e3e] focus:ring-[#e53e3e]/15'
      : 'border-caramel/20 focus:border-accent focus:ring-accent/15'
  }`

  return (
    <label className={`block ${disabled ? 'pointer-events-none' : ''}`}>
      <span className="text-[0.8rem] font-medium text-roast">{label}</span>
      <div className="relative">
        <input
          name={name}
          disabled={disabled}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          tabIndex={disabled ? -1 : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className={inputClass}
        />
        {endAdornment}
      </div>
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-[#c53030]">
          {error}
        </p>
      ) : null}
    </label>
  )
}
