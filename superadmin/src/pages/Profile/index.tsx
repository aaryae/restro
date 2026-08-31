import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Camera, KeyRound, Loader2, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useAuth } from '@/auth/AuthContext'
import {
  changeMyPassword,
  updateMyProfile,
  uploadMyAvatar,
} from '@/api/platform'
import { ApiError, buildAssetUrl } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import {
  FieldError,
  fieldInputClass,
  hasErrors,
  passwordText,
  requiredText,
  type FieldErrors,
} from '@/lib/formValidation'
import { cn } from '@/lib/utils'

type TabId = 'profile' | 'password'

type ProfileFields = 'name'
type PasswordFields = 'currentPassword' | 'newPassword' | 'confirmPassword'

export default function ProfilePage() {
  const { user, refreshMe } = useAuth()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<TabId>('profile')
  const [name, setName] = useState(user?.name || '')
  const [imageUrl, setImageUrl] = useState(user?.imageUrl || null)
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileFields>>(
    {},
  )
  const [profileTouched, setProfileTouched] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<
    FieldErrors<PasswordFields>
  >({})
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setImageUrl(user.imageUrl || null)
    setPhotoFailed(false)
  }, [user])

  function validateProfile(nextName: string): FieldErrors<ProfileFields> {
    return { name: requiredText(nextName, 'Name', 2) }
  }

  function validatePassword(values: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): FieldErrors<PasswordFields> {
    const errors: FieldErrors<PasswordFields> = {
      currentPassword: requiredText(values.currentPassword, 'Current password'),
      newPassword: passwordText(values.newPassword, {
        required: true,
        min: 10,
        label: 'New password',
      }),
    }
    if (
      values.newPassword &&
      values.confirmPassword &&
      values.newPassword !== values.confirmPassword
    ) {
      errors.confirmPassword = 'Passwords do not match'
    } else if (!values.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password is required'
    }
    return errors
  }

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault()
    setProfileTouched(true)
    const errors = validateProfile(name)
    setProfileErrors(errors)
    if (hasErrors(errors)) return

    setSavingProfile(true)
    try {
      await updateMyProfile({ name: name.trim() })
      await refreshMe()
      toast('Profile updated', 'success')
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Failed to update profile',
        'error',
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function onPickPhoto(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file (JPG, PNG, GIF, or WebP)', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be 2MB or smaller', 'error')
      return
    }

    setUploading(true)
    try {
      const updated = await uploadMyAvatar(file)
      setImageUrl(updated.imageUrl || null)
      await refreshMe()
      toast('Photo updated', 'success')
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Failed to upload photo',
        'error',
      )
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onRemovePhoto() {
    setUploading(true)
    try {
      await updateMyProfile({ imageUrl: null })
      setImageUrl(null)
      await refreshMe()
      toast('Photo removed', 'success')
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Failed to remove photo',
        'error',
      )
    } finally {
      setUploading(false)
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordTouched(true)
    const values = { currentPassword, newPassword, confirmPassword }
    const errors = validatePassword(values)
    setPasswordErrors(errors)
    if (hasErrors(errors)) return

    setSavingPassword(true)
    try {
      await changeMyPassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordTouched(false)
      setPasswordErrors({})
      toast('Password changed', 'success')
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Failed to change password',
        'error',
      )
    } finally {
      setSavingPassword(false)
    }
  }

  const initials = (user?.name || 'SA')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const photoSrc = !photoFailed ? buildAssetUrl(imageUrl) : ''

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Update your photo, display name, and password"
      />

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <nav className="flex min-w-0 w-full shrink-0 gap-2 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:overflow-visible lg:pb-0">
          {(
            [
              {
                id: 'profile' as const,
                label: 'Basic information',
                description: 'Name and photo',
                icon: UserRound,
              },
              {
                id: 'password' as const,
                label: 'Password',
                description: 'Change your password',
                icon: KeyRound,
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex min-w-[14rem] flex-1 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition lg:min-w-0 lg:flex-none',
                  active
                    ? 'border-primary/30 bg-primary/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    active
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-500',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      active ? 'text-primary' : 'text-slate-800',
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {item.description}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <section className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {tab === 'profile' ? (
            <div>
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-sm font-semibold text-slate-800">
                  Basic information
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Update your photo and display name
                </p>
              </div>

              <div className="space-y-5 p-4 sm:p-5">
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mx-0 sm:h-28 sm:w-28">
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt={user?.name || 'Profile'}
                        className="h-full w-full object-cover"
                        onError={() => setPhotoFailed(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary text-2xl font-semibold text-white">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user?.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      @{user?.username}
                      {user?.platformRole
                        ? ` · ${user.platformRole === 'owner' ? 'Owner' : 'Operator'}`
                        : ''}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => onPickPhoto(e.target.files?.[0])}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        {uploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" />
                        )}
                        {uploading ? 'Uploading…' : 'Upload photo'}
                      </Button>
                      {imageUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          onClick={() => void onRemovePhoto()}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                      JPG, PNG, GIF, or WebP. Max 2MB.
                    </p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={onSaveProfile}>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Username
                    </label>
                    <input
                      value={user?.username || ''}
                      disabled
                      className={cn(fieldInputClass(), 'bg-slate-50 text-slate-500')}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Username cannot be changed
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Display name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => {
                        const next = e.target.value
                        setName(next)
                        if (profileTouched) {
                          setProfileErrors(validateProfile(next))
                        }
                      }}
                      className={fieldInputClass(Boolean(profileErrors.name))}
                      placeholder="Your name"
                    />
                    <FieldError message={profileErrors.name} />
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-4">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {savingProfile ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div>
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-sm font-semibold text-slate-800">
                  Change password
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Use a strong password you don&apos;t reuse elsewhere
                </p>
              </div>

              <form
                className="space-y-4 p-4 sm:p-5"
                onSubmit={onChangePassword}
              >
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Current password
                    </label>
                    <PasswordInput
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        if (passwordTouched) {
                          setPasswordErrors(
                            validatePassword({
                              currentPassword: e.target.value,
                              newPassword,
                              confirmPassword,
                            }),
                          )
                        }
                      }}
                      autoComplete="current-password"
                    />
                    <FieldError message={passwordErrors.currentPassword} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      New password
                    </label>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (passwordTouched) {
                          setPasswordErrors(
                            validatePassword({
                              currentPassword,
                              newPassword: e.target.value,
                              confirmPassword,
                            }),
                          )
                        }
                      }}
                      autoComplete="new-password"
                    />
                    <FieldError message={passwordErrors.newPassword} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Confirm new password
                    </label>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (passwordTouched) {
                          setPasswordErrors(
                            validatePassword({
                              currentPassword,
                              newPassword,
                              confirmPassword: e.target.value,
                            }),
                          )
                        }
                      }}
                      autoComplete="new-password"
                    />
                    <FieldError message={passwordErrors.confirmPassword} />
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {savingPassword ? 'Updating…' : 'Change password'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
