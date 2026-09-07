import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, Loader2, RotateCcw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  HtmlBodyEditor,
  htmlToPlainText,
} from '@/pages/Settings/HtmlBodyEditor'
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

export default function EditEmailTemplatePage() {
  const { key = '' } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const canManage = can('users.manage')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [showSource, setShowSource] = useState(false)
  const [showPlain, setShowPlain] = useState(false)
  const [insertTarget, setInsertTarget] = useState<'subject' | 'body'>('body')

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

  const selected = useMemo(
    () =>
      (templatesQuery.data?.items || []).find((item) => item.key === key) ||
      null,
    [templatesQuery.data?.items, key],
  )

  useEffect(() => {
    if (!selected) return
    setSubject(selected.subject)
    setBodyHtml(selected.bodyHtml)
    setBodyText(selected.bodyText)
    setShowSource(false)
    setShowPlain(false)
  }, [selected?.key, selected?.subject, selected?.bodyHtml, selected?.bodyText])

  const saveMut = useMutation({
    mutationFn: () => {
      const html = bodyHtml.trim()
      const plain = bodyText.trim() || htmlToPlainText(html)
      return saveCafeEmailTemplate(key, {
        subject: subject.trim(),
        bodyHtml: html,
        bodyText: plain,
      })
    },
    onSuccess: (template) => {
      toast(`Saved ${template.label}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
      navigate('/settings/email-templates')
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : 'Save failed', 'error'),
  })

  const resetMut = useMutation({
    mutationFn: () => resetCafeEmailTemplate(key),
    onSuccess: (template) => {
      toast(`Reset ${template.label}`)
      setSubject(template.subject)
      setBodyHtml(template.bodyHtml)
      setBodyText(template.bodyText)
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : 'Reset failed', 'error'),
  })

  const dirty =
    selected &&
    (subject !== selected.subject ||
      bodyHtml !== selected.bodyHtml ||
      bodyText !== selected.bodyText)

  const busy = saveMut.isPending || resetMut.isPending
  const fromAddress =
    smtpQuery.data?.configured && smtpQuery.data.username
      ? smtpQuery.data.username
      : 'Configure SMTP first'
  const previewSubject = applySamplePreview(subject)
  const previewHtml = applySamplePreview(bodyHtml)

  if (!canManage) {
    return (
      <PageError message="You do not have permission to manage templates." />
    )
  }

  if (templatesQuery.isLoading && !templatesQuery.data) {
    return <LoadingScreen label="Loading template…" />
  }

  if (templatesQuery.isError && !templatesQuery.data) {
    return (
      <PageError
        error={templatesQuery.error}
        onRetry={() => templatesQuery.refetch()}
      />
    )
  }

  if (!selected) {
    return (
      <PageError
        message="Template not found."
        onRetry={() => navigate('/settings/email-templates')}
      />
    )
  }

  function insertVariable(varKey: string) {
    if (insertTarget === 'subject') {
      setSubject((prev) => appendToken(prev, varKey))
      return
    }
    setBodyHtml((prev) => {
      const token = variableToken(varKey)
      if (!prev.trim()) return token
      // Prefer inserting into a paragraph-like spot near the end.
      if (prev.includes('</p>')) {
        return prev.replace(/<\/p>(?![\s\S]*<\/p>)/, ` ${token}</p>`)
      }
      return `${prev} ${token}`
    })
    setBodyText((prev) => appendToken(prev, varKey))
  }

  return (
    <div className="pb-8">
      <div className="mb-4">
        <Link
          to="/settings/email-templates"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All templates
        </Link>
      </div>

      <PageHeader
        title={selected.label}
        subtitle={selected.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
              Use default
            </Button>
            <Button
              type="button"
              disabled={busy || !dirty || !subject.trim() || !bodyHtml.trim()}
              onClick={() => saveMut.mutate()}
              className="min-w-[7.5rem]"
            >
              {saveMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Template name
              </span>
              <input
                value={selected.label}
                readOnly
                className={fieldInputClass(false, 'h-11 bg-slate-50 text-slate-700')}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Template key
              </span>
              <input
                value={selected.key}
                readOnly
                className={fieldInputClass(
                  false,
                  'h-11 bg-slate-50 font-mono text-xs text-slate-700',
                )}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                From
              </span>
              <input
                value={fromAddress}
                readOnly
                className={fieldInputClass(false, 'h-11 bg-slate-50 text-slate-700')}
              />
              {!smtpQuery.data?.configured ? (
                <p className="mt-1 text-xs text-amber-700">
                  <Link to="/settings/smtp" className="underline">
                    Set up SMTP
                  </Link>{' '}
                  so owner emails can send.
                </p>
              ) : null}
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">
                Variables
              </span>
              <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setInsertTarget('subject')}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-medium transition',
                    insertTarget === 'subject'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  Subject
                </button>
                <button
                  type="button"
                  onClick={() => setInsertTarget('body')}
                  className={cn(
                    'rounded-md px-2.5 py-1 font-medium transition',
                    insertTarget === 'body'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  Body
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Tap a chip to insert into the {insertTarget}. Placeholders fill
              with live cafe details when the email sends.
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.variables.map((varKey) => (
                <button
                  key={varKey}
                  type="button"
                  onClick={() => insertVariable(varKey)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  {VARIABLE_LABELS[varKey] || varKey}
                  <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                    {variableToken(varKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Subject <span className="text-red-500">*</span>
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => setInsertTarget('subject')}
              className={fieldInputClass(false, 'h-11 text-base')}
              placeholder="Inbox subject line"
            />
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">
                Body <span className="text-red-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSource((v) => !v)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                {showSource ? 'Visual editor' : 'HTML source'}
              </button>
            </div>
            {showSource ? (
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                onFocus={() => setInsertTarget('body')}
                className={cn(
                  fieldInputClass(false, 'min-h-[320px] resize-y py-3'),
                  'font-mono text-xs leading-relaxed',
                )}
                spellCheck={false}
              />
            ) : (
              <div onFocusCapture={() => setInsertTarget('body')}>
                <HtmlBodyEditor value={bodyHtml} onChange={setBodyHtml} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60">
            <button
              type="button"
              onClick={() => setShowPlain((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Plain-text fallback
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition',
                  showPlain && 'rotate-180',
                )}
              />
            </button>
            {showPlain ? (
              <div className="border-t border-slate-200/80 px-4 pb-4 pt-3">
                <p className="mb-2 text-xs text-slate-500">
                  Used by clients that don’t show HTML. Leave blank to generate
                  from the body on save.
                </p>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className={cn(
                    fieldInputClass(false, 'min-h-[160px] resize-y py-3'),
                    'text-sm leading-6',
                  )}
                  placeholder="Auto-generated from body if empty"
                />
              </div>
            ) : null}
          </div>

          <p className="text-xs text-slate-500">
            Sent when you{' '}
            <span className="font-medium text-slate-700">
              {selected.trigger.toLowerCase()}
            </span>
            .
          </p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Inbox preview
              </h2>
              <p className="text-sm text-slate-500">
                Sample values — live sends use real cafe data
              </p>
            </div>
            {selected.isCustom ? (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                Custom
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                Default
              </span>
            )}
          </div>
          <GmailPreview subject={previewSubject} html={previewHtml} />
        </section>
      </div>
    </div>
  )
}
