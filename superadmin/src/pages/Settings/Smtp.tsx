import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import { fetchPlatformSmtp, upsertPlatformSmtp } from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import {
  FieldError,
  fieldInputClass,
  hasErrors,
  requiredText,
  type FieldErrors,
} from '@/lib/formValidation'

type SmtpForm = {
  username: string
  passkey: string
  host: string
  port: string
  secure: boolean
}

type SmtpField = 'username' | 'passkey' | 'host' | 'port'

const emptySmtp: SmtpForm = {
  username: '',
  passkey: '',
  host: 'smtp.gmail.com',
  port: '465',
  secure: true,
}

function validateSmtpForm(
  form: SmtpForm,
  opts: { requirePasskey: boolean },
): FieldErrors<SmtpField> {
  const portNum = Number(form.port)
  return {
    username: requiredText(form.username, 'Username', 3),
    host: requiredText(form.host, 'Host', 3),
    port:
      !form.port.trim() || !Number.isFinite(portNum) || portNum <= 0
        ? 'Enter a valid port'
        : undefined,
    passkey: opts.requirePasskey
      ? requiredText(form.passkey, 'Pass key', 6)
      : undefined,
  }
}

export default function SmtpSettingsPage() {
  const { can } = useAuth()
  const canManage = can('users.manage')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SmtpForm>(emptySmtp)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SmtpField>>({})
  const [formError, setFormError] = useState('')
  const [touched, setTouched] = useState(false)

  const smtpQuery = useQuery({
    queryKey: queryKeys.smtp,
    queryFn: fetchPlatformSmtp,
    enabled: canManage,
  })

  const configured = Boolean(
    smtpQuery.data && smtpQuery.data.configured === true,
  )

  useEffect(() => {
    const data = smtpQuery.data
    if (!data) return
    if (data.configured) {
      setForm({
        username: data.username,
        passkey: '',
        host: data.host,
        port: String(data.port),
        secure: data.secure,
      })
    } else {
      setForm(emptySmtp)
    }
    setFieldErrors({})
    setFormError('')
    setTouched(false)
  }, [smtpQuery.data])

  function setFormValue<K extends keyof SmtpForm>(key: K, value: SmtpForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (touched) {
        setFieldErrors(
          validateSmtpForm(next, { requirePasskey: !configured }),
        )
      }
      return next
    })
    if (formError) setFormError('')
  }

  const saveMut = useMutation({
    mutationFn: upsertPlatformSmtp,
    onSuccess: () => {
      toast(configured ? 'SMTP updated' : 'SMTP configured')
      queryClient.invalidateQueries({ queryKey: queryKeys.smtp })
      setForm((prev) => ({ ...prev, passkey: '' }))
      setTouched(false)
      setFormError('')
    },
    onError: (err) =>
      setFormError(err instanceof ApiError ? err.message : 'Save failed'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const nextErrors = validateSmtpForm(form, {
      requirePasskey: !configured,
    })
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      setFormError('Please fix the highlighted fields.')
      return
    }

    saveMut.mutate({
      username: form.username.trim(),
      host: form.host.trim(),
      port: Number(form.port),
      secure: form.secure,
      ...(form.passkey.trim() ? { passkey: form.passkey.trim() } : {}),
    })
  }

  return (
    <div>
      <PageHeader
        title="SMTP"
        subtitle="Platform mail for Serve signup OTPs and system emails"
      />

      {!canManage ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Only the Owner can manage platform SMTP.
        </div>
      ) : smtpQuery.isLoading && !smtpQuery.data ? (
        <LoadingScreen label="Loading SMTP…" />
      ) : smtpQuery.isError && !smtpQuery.data ? (
        <PageError
          message={(smtpQuery.error as Error).message}
          onRetry={() => smtpQuery.refetch()}
        />
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm text-slate-500">
              Cafe POS mail settings are separate and configured inside each
              cafe.
            </p>
            {configured ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Configured
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Not configured — OTPs will only appear in server logs
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-w-xl space-y-3"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Username *
              </span>
              <input
                type="email"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setFormValue('username', e.target.value)}
                placeholder="you@gmail.com"
                className={fieldInputClass(Boolean(fieldErrors.username))}
              />
              <FieldError message={fieldErrors.username} />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Pass key {configured ? '(leave blank to keep current)' : '*'}
              </span>
              <PasswordInput
                autoComplete="new-password"
                value={form.passkey}
                onChange={(e) => setFormValue('passkey', e.target.value)}
                placeholder={
                  configured
                    ? '••••••••••••••••'
                    : 'App password / SMTP password'
                }
                inputClassName={
                  fieldErrors.passkey
                    ? 'border-red-300 focus:border-red-400'
                    : undefined
                }
              />
              <FieldError message={fieldErrors.passkey} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Host *
                </span>
                <input
                  value={form.host}
                  onChange={(e) => setFormValue('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className={fieldInputClass(Boolean(fieldErrors.host))}
                />
                <FieldError message={fieldErrors.host} />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Port *
                </span>
                <input
                  inputMode="numeric"
                  value={form.port}
                  onChange={(e) => setFormValue('port', e.target.value)}
                  placeholder="465"
                  className={fieldInputClass(Boolean(fieldErrors.port))}
                />
                <FieldError message={fieldErrors.port} />
              </label>
            </div>

            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={form.secure}
                onChange={(e) => setFormValue('secure', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-slate-700">
                Use TLS/SSL (secure) — check for port 465
              </span>
            </label>

            {formError ? (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save SMTP
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
