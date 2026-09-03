import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Loader2, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import {
  fetchCafeEmailTemplates,
  fetchPlatformSmtp,
  resetCafeEmailTemplate,
  saveCafeEmailTemplate,
} from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import { fieldInputClass } from '@/lib/formValidation'
import { cn } from '@/lib/utils'
import { GmailPreview } from '@/pages/Settings/GmailPreview'
import {
  VARIABLE_LABELS,
  variableToken,
} from '@/pages/Settings/emailTemplateLabels'

const SAMPLE_VALUES: Record<string, string> = {
  cafeName: 'Hillside Cafe',
  ownerName: 'Alex',
  ownerUsername: 'hillsidecafe',
  ownerPassword: 'ServeTemp123!',
  posUrl: 'https://hillside-cafe.servecafe.app',
  trialEndsAt: 'Sep 15, 2026',
  status: 'Trial',
  restoredStatus: 'Trial',
  reason: 'Payment overdue',
  days: '7',
}

function applySamplePreview(template: string) {
  return template.replace(/\{(\w+)\}/g, (_, key) => SAMPLE_VALUES[key] ?? `{${key}}`)
}

function appendToken(value: string, key: string) {
  const token = variableToken(key)
  if (!value.trim()) return token
  const spacer = value.endsWith('\n') || value.endsWith(' ') ? '' : ' '
  return `${value}${spacer}${token}`
}

export default function EmailTemplatesPage() {
  const { can } = useAuth()
  const canManage = can('users.manage')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedKey, setSelectedKey] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const templatesQuery = useQuery({
    queryKey: queryKeys.emailTemplates,
    queryFn: fetchCafeEmailTemplates,
    enabled: canManage,
  })

  const smtpQuery = useQuery({
    queryKey: queryKeys.smtp,
    queryFn: fetchPlatformSmtp,
    enabled: canManage,
  })

  const items = templatesQuery.data?.items || []

  useEffect(() => {
    if (!selectedKey && items[0]) setSelectedKey(items[0].key)
  }, [items, selectedKey])

  const selected = useMemo(
    () => items.find((item) => item.key === selectedKey) || items[0] || null,
    [items, selectedKey],
  )

  useEffect(() => {
    if (!selected) return
    setSubject(selected.subject)
    setBodyHtml(selected.bodyHtml)
    setBodyText(selected.bodyText)
    setShowAdvanced(false)
  }, [selected?.key, selected?.subject, selected?.bodyHtml, selected?.bodyText])

  const saveMut = useMutation({
    mutationFn: () =>
      saveCafeEmailTemplate(selected!.key, {
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim(),
        bodyText: bodyText.trim(),
      }),
    onSuccess: (template) => {
      toast(`Saved ${template.label}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : 'Save failed', 'error'),
  })

  const resetMut = useMutation({
    mutationFn: () => resetCafeEmailTemplate(selected!.key),
    onSuccess: (template) => {
      toast(`Reset ${template.label}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : 'Reset failed', 'error'),
  })

  const smtpConfigured = Boolean(
    smtpQuery.data && smtpQuery.data.configured === true,
  )

  const dirty =
    selected &&
    (subject !== selected.subject ||
      bodyHtml !== selected.bodyHtml ||
      bodyText !== selected.bodyText)

  const busy = saveMut.isPending || resetMut.isPending
  const previewSubject = applySamplePreview(subject)
  const previewHtml = applySamplePreview(bodyHtml)

  if (!canManage) {
    return <PageError message="You do not have permission to manage templates." />
  }

  if (templatesQuery.isLoading && !templatesQuery.data) {
    return <LoadingScreen label="Loading emails…" />
  }

  if (templatesQuery.isError && !templatesQuery.data) {
    return (
      <PageError
        error={templatesQuery.error}
        onRetry={() => templatesQuery.refetch()}
      />
    )
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Owner emails"
        subtitle="Choose an email, edit the wording, and see exactly how it lands in Gmail."
        actions={
          smtpConfigured ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ready to send
            </span>
          ) : (
            <Link
              to="/settings/smtp"
              className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200/80 hover:bg-amber-100"
            >
              Connect email delivery
            </Link>
          )
        }
      />

      {selected ? (
        <>
          <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0 flex-1 sm:max-w-lg">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Which email?
                </span>
                <div className="relative">
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className={cn(
                      fieldInputClass(),
                      'h-12 appearance-none pr-10 text-base',
                    )}
                  >
                    {items.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
              <p className="mt-2 text-sm text-slate-500">
                Sent automatically when you{' '}
                <span className="font-medium text-slate-700">
                  {selected.trigger.toLowerCase()}
                </span>
                .
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              {dirty ? (
                <span className="text-xs font-medium text-amber-700">
                  Unsaved changes
                </span>
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={busy || !selected.isCustom}
                onClick={() => resetMut.mutate()}
              >
                <RotateCcw className="h-4 w-4" />
                Use default text
              </Button>
              <Button
                type="button"
                disabled={busy || !dirty}
                onClick={() => saveMut.mutate()}
                className="min-w-[7.5rem]"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Edit email
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selected.description}
              </p>

              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Subject
                  </span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={fieldInputClass(false, 'h-12 text-base')}
                    placeholder="What appears in the inbox"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Message
                  </span>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className={cn(
                      fieldInputClass(false, 'min-h-[280px] resize-y py-3.5'),
                      'text-[15px] leading-7 text-slate-800',
                    )}
                    placeholder="Write what the cafe owner should read…"
                  />
                </label>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Personalize with
                  </p>
                  <p className="mb-3 text-xs leading-relaxed text-slate-500">
                    Tap to add a placeholder — it fills in with real cafe
                    details when the email sends.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.variables.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setBodyText((prev) => appendToken(prev, key))
                        }
                        className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                      >
                        {VARIABLE_LABELS[key] || key}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Advanced layout
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-slate-400 transition',
                        showAdvanced && 'rotate-180',
                      )}
                    />
                  </button>
                  {showAdvanced ? (
                    <div className="border-t border-slate-200/80 px-4 pb-4 pt-3">
                      <p className="mb-2 text-xs leading-relaxed text-slate-500">
                        Only change this if you need custom styling. Most teams
                        leave it as-is.
                      </p>
                      <textarea
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                        className={cn(
                          fieldInputClass(false, 'min-h-[240px] resize-y py-3'),
                          'font-mono text-xs leading-relaxed',
                        )}
                        spellCheck={false}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Gmail preview
                  </h2>
                  <p className="text-sm text-slate-500">
                    How owners see it in their inbox
                  </p>
                </div>
                {selected.isCustom ? (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                    Your version
                  </span>
                ) : null}
              </div>
              <GmailPreview subject={previewSubject} html={previewHtml} />
            </section>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          No emails to edit yet.
        </div>
      )}
    </div>
  )
}
