import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormAlert, FormSuccess } from '@/components/ui/FormAlert'
import { Input } from '@/components/ui/Input'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Select } from '@/components/ui/Select'
import { createCafe, type CreateCafeInput } from '@/api/platform'
import { ApiError } from '@/api/client'
import { generateOwnerPassword } from '@/lib/password'
import { useFormState } from '@/hooks/useFormState'
import {
  emailText,
  intInRange,
  optionalMin,
  optionalOwnerUsernameText,
  passwordText,
  phoneText,
  requiredText,
  slugText,
  type FieldErrors,
} from '@/lib/formValidation'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (result: {
    cafeName: string
    slug: string
    ownerUsername?: string
    ownerPassword?: string
  }) => void
}

type CafeForm = {
  name: string
  email: string
  phone: string
  password: string
  slug: string
  username: string
  ownerName: string
  businessType: string
  address: string
  status: 'trial' | 'active'
  trialDays: string
}

type CafeField =
  | 'name'
  | 'email'
  | 'phone'
  | 'password'
  | 'slug'
  | 'username'
  | 'ownerName'
  | 'trialDays'

const emptyForm: CafeForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  slug: '',
  username: '',
  ownerName: '',
  businessType: '',
  address: '',
  status: 'trial',
  trialDays: '14',
}

function slugifyPreview(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

function validateCafeForm(form: CafeForm): FieldErrors<CafeField> {
  const errors: FieldErrors<CafeField> = {
    name: requiredText(form.name, 'Cafe name', 2),
    email: emailText(form.email, 'Owner email'),
    phone: phoneText(form.phone),
    password: passwordText(form.password, { required: false, min: 6 }),
    slug: slugText(form.slug),
    username: optionalOwnerUsernameText(form.username),
    ownerName: optionalMin(form.ownerName, 'Owner name', 2),
  }

  if (form.status === 'trial') {
    errors.trialDays = intInRange(form.trialDays, 'Trial days', 1, 90)
  }

  return errors
}

export function CreateCafeModal({ open, onClose, onCreated }: Props) {
  const [createdCreds, setCreatedCreds] = useState<{
    cafeName: string
    slug: string
    ownerUsername?: string
    ownerPassword?: string
  } | null>(null)
  const [copied, setCopied] = useState<'user' | 'pass' | null>(null)

  const form = useFormState<CafeForm, CafeField>({
    initialValues: emptyForm,
    validate: validateCafeForm,
    onSubmit: async (values) => {
      const payload: CreateCafeInput = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        password: values.password.trim() || undefined,
        slug: values.slug.trim() || undefined,
        username: values.username.trim() || undefined,
        ownerName: values.ownerName.trim() || undefined,
        businessType: values.businessType.trim() || undefined,
        address: values.address.trim() || undefined,
        status: values.status,
        trialDays:
          values.status === 'trial'
            ? Math.min(90, Math.max(1, Number(values.trialDays) || 14))
            : undefined,
      }

      try {
        const result = await createCafe(payload)
        const created = {
          cafeName: result.cafe.name,
          slug: result.cafe.slug,
          ownerUsername: result.ownerUsername,
          ownerPassword: result.ownerPassword,
        }
        onCreated(created)
        if (created.ownerPassword) {
          setCreatedCreds(created)
        } else {
          onClose()
        }
      } catch (err) {
        throw new Error(
          err instanceof ApiError ? err.message : 'Failed to create cafe',
        )
      }
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset(emptyForm)
    setCreatedCreds(null)
    setCopied(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only
  }, [open])

  async function copyText(value: string, which: 'user' | 'pass') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  function fillGeneratedPassword() {
    form.setValue('password', generateOwnerPassword())
    form.setFieldErrors((prev) => ({ ...prev, password: '' }))
  }

  const slugHint =
    form.values.slug.trim() || slugifyPreview(form.values.name) || 'slug'
  const busy = form.submitting

  if (createdCreds) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Cafe created"
        description="Copy the owner credentials now — they will not be shown again."
        size="md"
        scrollBody
        footer={
          <ModalActions>
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </ModalActions>
        }
      >
        <div className="space-y-4">
          <FormSuccess>{createdCreds.cafeName} is ready.</FormSuccess>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {createdCreds.ownerUsername ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Username
                  </p>
                  <p className="truncate font-mono text-sm text-slate-900">
                    {createdCreds.ownerUsername}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    copyText(createdCreds.ownerUsername || '', 'user')
                  }
                >
                  {copied === 'user' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            ) : null}
            {createdCreds.ownerPassword ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Temp password
                  </p>
                  <p className="truncate font-mono text-sm text-slate-900">
                    {createdCreds.ownerPassword}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    copyText(createdCreds.ownerPassword || '', 'pass')
                  }
                >
                  {copied === 'pass' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create cafe"
      description="Provisions schema, migrations, and owner login."
      size="md"
      busy={busy}
      scrollBody={false}
      showClose
    >
      <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            className="sm:col-span-2"
            label="Cafe name"
            required
            value={form.values.name}
            onChange={(e) => form.setValue('name', e.target.value)}
            error={form.fieldErrors.name}
            placeholder="Hillside Cafe"
          />

          <Input
            className="sm:col-span-2"
            label="Owner username"
            value={form.values.username}
            onChange={(e) => form.setValue('username', e.target.value)}
            error={form.fieldErrors.username}
            placeholder="Same as cafe name if empty"
            autoComplete="off"
          />

          <Input
            className="sm:col-span-2"
            label="Owner email"
            required
            type="email"
            value={form.values.email}
            onChange={(e) => form.setValue('email', e.target.value)}
            error={form.fieldErrors.email}
            placeholder="owner@example.com"
          />

          <Input
            label="Owner name"
            value={form.values.ownerName}
            onChange={(e) => form.setValue('ownerName', e.target.value)}
            error={form.fieldErrors.ownerName}
            placeholder="Optional"
          />

          <Input
            label="Owner phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={form.values.phone}
            onChange={(e) =>
              form.setValue(
                'phone',
                e.target.value.replace(/\D/g, '').slice(0, 10),
              )
            }
            onKeyDown={(e) => {
              if (
                e.ctrlKey ||
                e.metaKey ||
                e.key === 'Backspace' ||
                e.key === 'Delete' ||
                e.key === 'Tab' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'Home' ||
                e.key === 'End'
              ) {
                return
              }
              if (!/^\d$/.test(e.key)) e.preventDefault()
            }}
            onPaste={(e) => {
              e.preventDefault()
              form.setValue(
                'phone',
                e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10),
              )
            }}
            error={form.fieldErrors.phone}
            placeholder="9800000000"
          />

          <Input
            className="sm:col-span-2"
            label="Slug"
            value={form.values.slug}
            onChange={(e) =>
              form.setValue(
                'slug',
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              )
            }
            error={form.fieldErrors.slug}
            placeholder="auto from name if empty"
            hint={`${slugHint}.${
              String(
                import.meta.env.VITE_TENANT_BASE_DOMAIN || 'localhost',
              ).replace(/^\.+|\.+$/g, '') || 'localhost'
            }`}
          />

          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                Owner password
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fillGeneratedPassword}
                disabled={busy}
                className="h-auto gap-1 px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-transparent hover:text-primary/80"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto-generate
              </Button>
            </div>
            <PasswordInput
              value={form.values.password}
              onChange={(e) => form.setValue('password', e.target.value)}
              placeholder="Optional — use auto-generate or leave blank"
              error={form.fieldErrors.password}
            />
          </div>

          <Select
            label="Status"
            value={form.values.status}
            onChange={(e) =>
              form.setValue('status', e.target.value as 'trial' | 'active')
            }
          >
            <option value="trial">Trial</option>
            <option value="active">Active</option>
          </Select>

          {form.values.status === 'trial' ? (
            <Input
              label="Trial days"
              required
              type="number"
              min={1}
              max={90}
              value={form.values.trialDays}
              onChange={(e) => form.setValue('trialDays', e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              error={form.fieldErrors.trialDays}
            />
          ) : (
            <div />
          )}

          <Input
            label="Business type"
            value={form.values.businessType}
            onChange={(e) => form.setValue('businessType', e.target.value)}
            placeholder="Cafe / Restaurant"
          />

          <Input
            label="Address"
            value={form.values.address}
            onChange={(e) => form.setValue('address', e.target.value)}
            placeholder="Optional"
          />
        </div>

        <FormAlert>{form.formError}</FormAlert>

        <ModalActions className="border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {busy ? 'Creating…' : 'Create cafe'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
