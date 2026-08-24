import { Link, NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { sideMenuItems } from '@/layout/sideMenu'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'
import serveLogo from '@/assets/logo.png'

type Props = {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: Props) {
  const { can } = useAuth()
  const items = sideMenuItems.filter((item) => {
    if (!item.permission) return true
    return can(item.permission)
  })

  return (
    <aside className="flex h-full flex-col bg-white">
      <div
        className={cn(
          'relative flex h-16 items-center border-b border-slate-200 px-3',
          open ? 'justify-between' : 'justify-center',
        )}
      >
        {open ? (
          <Link to="/" className="flex min-w-0 items-center gap-2.5 cursor-pointer">
            <img
              src={serveLogo}
              alt="Serve"
              className="h-10 w-auto max-w-[120px] object-contain object-left"
            />
          </Link>
        ) : (
          <img
            src={serveLogo}
            alt="Serve"
            className="h-9 w-9 object-contain"
          />
        )}

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 md:inline-flex',
            !open && 'absolute left-[4.25rem] top-4 z-10 bg-white shadow-sm',
          )}
          aria-label="Toggle sidebar"
        >
          {open ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100',
                  !open && 'justify-center px-2',
                )
              }
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {open ? <span>{item.label}</span> : null}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
