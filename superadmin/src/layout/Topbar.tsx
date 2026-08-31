import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { buildAssetUrl } from '@/api/client'
import { cn } from '@/lib/utils'

type Props = {
  onOpenMobile: () => void
}

export function Topbar({ onOpenMobile }: Props) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPhotoFailed(false)
  }, [user?.imageUrl])

  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const initials = (user?.name || 'SA')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const photoSrc = !photoFailed ? buildAssetUrl(user?.imageUrl) : ''

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex items-center gap-3" ref={menuRef}>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">
            {user?.name || 'Platform Admin'}
          </p>
          <p className="text-xs text-slate-400">
            {user?.username}
            {user?.platformRole
              ? ` · ${user.platformRole === 'owner' ? 'Owner' : 'Operator'}`
              : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-primary text-xs font-semibold text-white ring-offset-2 transition hover:ring-2 hover:ring-primary/30',
            menuOpen && 'ring-2 ring-primary/30',
          )}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title="Account menu"
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            initials
          )}
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
              <p className="truncate text-sm font-medium text-slate-800">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-400">@{user?.username}</p>
            </div>
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserRound className="h-4 w-4 text-slate-400" />
              My Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                logout()
                navigate('/login')
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
