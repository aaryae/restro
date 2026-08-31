import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { sideMenuItems, type SideMenuItem } from '@/layout/sideMenu'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'
import serveLogo from '@/assets/logo.png'

type Props = {
  open: boolean
  onToggle: () => void
}

function itemVisible(
  item: Pick<SideMenuItem, 'permission'>,
  can: (p: NonNullable<SideMenuItem['permission']>) => boolean,
) {
  if (!item.permission) return true
  return can(item.permission)
}

function isPathActive(pathname: string, path: string, end = false) {
  if (end) return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function Sidebar({ open, onToggle }: Props) {
  const { can } = useAuth()
  const { pathname } = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const items = sideMenuItems
    .filter((item) => itemVisible(item, can))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => itemVisible(child, can)),
    }))

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev }
      for (const item of items) {
        if (!item.children?.length) continue
        if (isPathActive(pathname, item.path, item.path === '/')) {
          next[item.key] = true
        }
      }
      return next
    })
    // Only react to route changes; items are derived from auth + static menu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <aside className="flex h-full flex-col bg-white">
      <div
        className={cn(
          'relative flex h-16 items-center border-b border-slate-200 px-3',
          open ? 'justify-between' : 'justify-center',
        )}
      >
        {open ? (
          <Link to="/" className="flex min-w-0 cursor-pointer items-center gap-2.5">
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
          const children = item.children || []
          const hasChildren = children.length > 0
          const childActive = children.some((c) =>
            isPathActive(pathname, c.path),
          )
          const isExpanded = Boolean(expanded[item.key]) || childActive
          const defaultChildPath = children[0]?.path || item.path

          if (!hasChildren) {
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
          }

          // Collapsed rail: jump to first child; no nested indent.
          if (!open) {
            return (
              <NavLink
                key={item.key}
                to={defaultChildPath}
                className={cn(
                  'flex items-center justify-center rounded-xl px-2 py-2.5 text-sm font-medium transition',
                  childActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </NavLink>
            )
          }

          return (
            <div key={item.key} className="space-y-1">
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [item.key]: !isExpanded,
                  }))
                }
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  childActive || isExpanded
                    ? 'text-slate-900 hover:bg-slate-100'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
                aria-expanded={isExpanded}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ease-out',
                    isExpanded && 'rotate-180',
                  )}
                />
              </button>

              <div
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  isExpanded
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-0.5 pb-1 pl-7 pt-0.5">
                    {children.map((child, index) => {
                      const ChildIcon = child.icon
                      return (
                        <NavLink
                          key={child.key}
                          to={child.path}
                          style={{
                            transitionDelay: isExpanded
                              ? `${40 + index * 45}ms`
                              : '0ms',
                          }}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-300 ease-out',
                              isExpanded
                                ? 'translate-x-0 opacity-100'
                                : '-translate-x-1 opacity-0',
                              isActive
                                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                            )
                          }
                        >
                          <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          <span>{child.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
