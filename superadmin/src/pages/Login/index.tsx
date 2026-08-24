import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useAuth } from '@/auth/AuthContext'
import { ApiError } from '@/api/client'
import serveLogo from '@/assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('technirvana')
  const [password, setPassword] = useState('SuperAdmin@123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f6fa] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={serveLogo}
            alt="Serve"
            className="h-14 w-auto object-contain"
          />
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            Superadmin
          </h1>
          <p className="text-sm text-slate-500">Platform control login</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Username
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password
            </span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1.5"
              inputClassName="h-11 rounded-xl"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading} className="mt-2 w-full py-3">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  )
}
