import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { FormAlert } from '@/components/ui/FormAlert'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import { upsertPlatformSmtp } from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import { usePlatformSmtp } from '@/hooks/usePlatformSmtp'
import {
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

  const smtpQuery = usePlatformSmtp(canManage)

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
          error={smtpQuery.error}
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
            <Input
              label="Username"
              required
              type="email"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setFormValue('username', e.target.value)}
              placeholder="you@gmail.com"
              error={fieldErrors.username}
            />

            <PasswordInput
              label={
                configured
                  ? 'Pass key (leave blank to keep current)'
                  : 'Pass key'
              }
              required={!configured}
              autoComplete="new-password"
              value={form.passkey}
              onChange={(e) => setFormValue('passkey', e.target.value)}
              placeholder={
                configured
                  ? '••••••••••••••••'
                  : 'App password / SMTP password'
              }
              error={fieldErrors.passkey}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Host"
                required
                value={form.host}
                onChange={(e) => setFormValue('host', e.target.value)}
                placeholder="smtp.gmail.com"
                error={fieldErrors.host}
              />

              <Input
                label="Port"
                required
                inputMode="numeric"
                value={form.port}
                onChange={(e) => setFormValue('port', e.target.value)}
                placeholder="465"
                error={fieldErrors.port}
              />
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

            {formError ? <FormAlert>{formError}</FormAlert> : null}

            <div className="flex justify-end pt-1">
              <Button type="submit" loading={saveMut.isPending}>
                {saveMut.isPending ? 'Saving…' : 'Save SMTP'}
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
