import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { DataTable } from '@/components/Table/DataTable'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import {
  createPlatformUser,
  fetchPlatformUsers,
  updatePlatformUser,
} from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import {
  FieldError,
  fieldInputClass,
  hasErrors,
  passwordText,
  requiredText,
  usernameText,
  type FieldErrors,
} from '@/lib/formValidation'
import type { PlatformAccount, PlatformPermission } from '@/types'

const DEFAULT_PERMISSION_OPTIONS: Array<{
  key: PlatformPermission
  label: string
}> = [
  { key: 'dashboard.view', label: 'Show Dashboard' },
  { key: 'cafes.section', label: 'Show Cafes section' },
  { key: 'cafes.create', label: 'Create cafe' },
  { key: 'cafes.view', label: 'View cafe' },
  { key: 'cafes.activate', label: 'Activate cafe' },
  { key: 'cafes.extend', label: 'Extend trial' },
  { key: 'cafes.suspend', label: 'Suspend cafe' },
  { key: 'cafes.impersonate', label: 'Open POS' },
  { key: 'audit.read', label: 'Show Audit logs' },
]

type FormState = {
  name: string
  username: string
  password: string
  permissions: PlatformPermission[]
  isActive: boolean
}

type OperatorField = 'name' | 'username' | 'password' | 'permissions'

const emptyForm: FormState = {
  name: '',
  username: '',
  password: '',
  permissions: ['dashboard.view', 'cafes.section', 'cafes.view'],
  isActive: true,
}

function validateOperatorForm(
  form: FormState,
  opts: { editing: boolean; editingOwner: boolean },
): FieldErrors<OperatorField> {
  const errors: FieldErrors<OperatorField> = {
    name: requiredText(form.name, 'Name', 2),
  }

  if (!opts.editing) {
    errors.username = usernameText(form.username)
    errors.password = passwordText(form.password, { required: true, min: 10 })
  } else {
    errors.password = passwordText(form.password, { required: false, min: 10 })
  }

  if (!opts.editingOwner && form.permissions.length === 0) {
    errors.permissions = 'Select at least one permission'
  }

  return errors
}

export default function SettingsPage() {
  const { can, user: me } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const canManage = can('users.manage')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformAccount | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<OperatorField>>({})
  const [formError, setFormError] = useState('')
  const [touched, setTouched] = useState(false)

  const usersQuery = useQuery({
    queryKey: queryKeys.users({ page: 1, limit: 50 }),
    queryFn: () => fetchPlatformUsers({ page: 1, limit: 50 }),
    enabled: canManage,
  })

  const permissionOptions =
    usersQuery.data?.permissionOptions?.length
      ? usersQuery.data.permissionOptions
      : DEFAULT_PERMISSION_OPTIONS

  const editingOwner = editing?.platformRole === 'owner'

  useEffect(() => {
    if (!modalOpen) return
    if (editing) {
      setForm({
        name: editing.name,
        username: editing.username,
        password: '',
        permissions: editing.permissions.filter(
          (p) => p !== 'users.manage',
        ) as PlatformPermission[],
        isActive: editing.isActive,
      })
    } else {
      setForm(emptyForm)
    }
    setFormError('')
    setFieldErrors({})
    setTouched(false)
  }, [modalOpen, editing])

  function setFormValue<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (touched) {
        setFieldErrors(
          validateOperatorForm(next, {
            editing: Boolean(editing),
            editingOwner: Boolean(editingOwner),
          }),
        )
      }
      return next
    })
    if (formError) setFormError('')
  }

  function togglePermission(key: PlatformPermission) {
    setForm((prev) => {
      const has = prev.permissions.includes(key)
      const next = {
        ...prev,
        permissions: has
          ? prev.permissions.filter((p) => p !== key)
          : [...prev.permissions, key],
      }
      if (touched) {
        setFieldErrors(
          validateOperatorForm(next, {
            editing: Boolean(editing),
            editingOwner: Boolean(editingOwner),
          }),
        )
      }
      return next
    })
    if (formError) setFormError('')
  }

  const createMut = useMutation({
    mutationFn: createPlatformUser,
    onSuccess: (user) => {
      toast(`Created ${user.name}`)
      queryClient.invalidateQueries({ queryKey: ['platform', 'users'] })
      setModalOpen(false)
    },
    onError: (err) =>
      setFormError(err instanceof ApiError ? err.message : 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number
      input: Parameters<typeof updatePlatformUser>[1]
    }) => updatePlatformUser(id, input),
    onSuccess: (user) => {
      toast(`Updated ${user.name}`)
      queryClient.invalidateQueries({ queryKey: ['platform', 'users'] })
      setModalOpen(false)
    },
    onError: (err) =>
      setFormError(err instanceof ApiError ? err.message : 'Update failed'),
  })

  const busy = createMut.isPending || updateMut.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    const nextErrors = validateOperatorForm(form, {
      editing: Boolean(editing),
      editingOwner: Boolean(editingOwner),
    })
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      setFormError('Please fix the highlighted fields.')
      return
    }

    setFormError('')

    if (editing) {
      updateMut.mutate({
        id: editing.id,
        input: {
          name: form.name.trim(),
          isActive: form.isActive,
          ...(editingOwner ? {} : { permissions: form.permissions }),
          ...(form.password.trim()
            ? { password: form.password.trim() }
            : {}),
        },
      })
      return
    }

    createMut.mutate({
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      permissions: form.permissions,
    })
  }

  const items = usersQuery.data?.items || []
  useBodyScrollLock(modalOpen)

  return (
    <div>
      <PageHeader
        title="Settings"
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Add operator
            </Button>
          ) : null
        }
      />

      {!canManage ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Only the Owner can create operators and set permissions.
        </div>
      ) : usersQuery.isLoading && !usersQuery.data ? (
        <LoadingScreen label="Loading operators…" />
      ) : usersQuery.isError && !usersQuery.data ? (
        <PageError
          message={(usersQuery.error as Error).message}
          onRetry={() => usersQuery.refetch()}
        />
      ) : (
        <DataTable
          headers={['Operator', 'Role', 'Permissions', 'Status', 'Actions']}
          rows={items.map((account) => [
            <div key={`${account.id}-u`}>
              <p className="font-medium text-slate-900">{account.name}</p>
              <p className="text-xs text-slate-400">@{account.username}</p>
            </div>,
            <span
              key={`${account.id}-r`}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {account.platformRole === 'owner' ? 'Owner' : 'Operator'}
            </span>,
            <span
              key={`${account.id}-p`}
              className="inline-block max-w-[280px] truncate text-xs text-slate-500"
              title={
                account.platformRole === 'owner'
                  ? 'All permissions'
                  : account.permissions.join(', ')
              }
            >
              {account.platformRole === 'owner'
                ? 'All'
                : account.permissions.length
                  ? `${account.permissions.length} selected`
                  : 'None'}
            </span>,
            account.isActive ? (
              <span className="text-xs font-medium text-emerald-700">Active</span>
            ) : (
              <span className="text-xs font-medium text-slate-400">Inactive</span>
            ),
            <Button
              key={`${account.id}-a`}
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(account)
                setModalOpen(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>,
          ])}
          emptyMessage="No operators yet"
        />
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
          <div
            className="absolute inset-0"
            onClick={() => !busy && setModalOpen(false)}
          />
          <div className="relative flex max-h-[min(100dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[min(90dvh,880px)] sm:rounded-2xl">
            <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? 'Edit operator' : 'Add operator'}
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Name *
                </span>
                <input
                  value={form.name}
                  onChange={(e) => setFormValue('name', e.target.value)}
                  className={fieldInputClass(Boolean(fieldErrors.name))}
                />
                <FieldError message={fieldErrors.name} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Username *
                </span>
                <input
                  disabled={Boolean(editing)}
                  value={form.username}
                  onChange={(e) =>
                    setFormValue(
                      'username',
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9._-]/g, ''),
                    )
                  }
                  className={fieldInputClass(
                    Boolean(fieldErrors.username),
                    'disabled:bg-slate-50',
                  )}
                  placeholder="operator1"
                />
                <FieldError message={fieldErrors.username} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  {editing ? 'New password (optional)' : 'Password *'}
                </span>
                <PasswordInput
                  value={form.password}
                  onChange={(e) => setFormValue('password', e.target.value)}
                  placeholder={editing ? 'Leave blank to keep current' : ''}
                  className={
                    fieldErrors.password
                      ? '[&_input]:border-red-400 [&_input]:focus:border-red-500'
                      : undefined
                  }
                />
                <FieldError message={fieldErrors.password} />
              </label>

              {editingOwner ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Owner always has full access. Permissions are not limited by
                  checkboxes.
                </p>
              ) : (
                <fieldset
                  className={`rounded-xl border p-3 ${
                    fieldErrors.permissions
                      ? 'border-red-300'
                      : 'border-slate-200'
                  }`}
                >
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Permissions *
                  </legend>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    {permissionOptions.map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={form.permissions.includes(opt.key)}
                          onChange={() => togglePermission(opt.key)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError message={fieldErrors.permissions} />
                </fieldset>
              )}

              {editing ? (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={editing.id === me?.id}
                    onChange={(e) =>
                      setFormValue('isActive', e.target.checked)
                    }
                  />
                  Active
                </label>
              ) : null}

              {formError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : editing ? (
                    'Save changes'
                  ) : (
                    'Create operator'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
