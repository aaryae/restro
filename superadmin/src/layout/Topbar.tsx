import { Menu, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

type Props = {
  onOpenMobile: () => void
}

export function Topbar({ onOpenMobile }: Props) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

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
        {/* <div>
          <p className="text-sm font-semibold text-slate-900">
            Platform Control
          </p>
          <p className="hidden text-xs text-slate-400 sm:block">
            Manage cafes, trials, and provisioning
          </p>
        </div> */}
      </div>

      <div className="flex items-center gap-3">
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
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
          {(user?.name || 'SA')
            .split(/\s+/)
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
