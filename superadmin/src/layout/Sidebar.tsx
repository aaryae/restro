import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, PanelLeft } from 'lucide-react'
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

function NavTooltip({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="group/tip relative">
      {children}
      <div
        className={cn(
          'pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap',
          'rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md',
          'opacity-0 transition-opacity duration-150',
          'before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-[""]',
          'group-hover/tip:opacity-100',
        )}
      >
        {label}
      </div>
    </div>
  )
}

function CollapsedSubmenuFlyout({
  item,
  pathname,
  childActive,
}: {
  item: SideMenuItem & { children?: SideMenuItem['children'] }
  pathname: string
  childActive: boolean
}) {
  const Icon = item.icon
  const children = item.children || []

  return (
    <div className="group/menu relative">
      <div
        className={cn(
          'flex cursor-default items-center justify-center rounded-xl px-2 py-3 text-sm font-medium transition',
          childActive
            ? 'bg-primary text-white shadow-sm shadow-primary/20'
            : 'text-slate-600 hover:bg-slate-100',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
      </div>

      <div
        className={cn(
          'pointer-events-none absolute left-full top-0 z-50 ml-2 min-w-[12rem]',
          'rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg',
          'opacity-0 transition-opacity duration-150',
          'before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-[""]',
          'group-hover/menu:pointer-events-auto group-hover/menu:opacity-100',
        )}
      >
        <p className="px-2.5 py-1.5 text-xs font-semibold text-slate-400">
          {item.label}
        </p>
        {children.map((child) => {
          const ChildIcon = child.icon
          const active = isPathActive(pathname, child.path)
          return (
            <Link
              key={child.key}
              to={child.path}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <ChildIcon className="h-4 w-4 shrink-0 opacity-90" />
              {child.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
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
    <aside className={cn('flex h-full flex-col bg-white', !open && 'overflow-visible')}>
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-slate-200 px-3',
          open ? 'justify-between' : 'justify-center',
        )}
      >
        {open ? (
          <>
            <Link to="/" className="flex min-w-0 cursor-pointer items-center gap-2.5">
              <img
                src={serveLogo}
                alt="Serve"
                className="h-10 w-auto max-w-[120px] object-contain object-left"
              />
            </Link>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-1 transition-opacity hover:opacity-80"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <img src={serveLogo} alt="Serve" className="h-9 w-9 object-contain" />
          </button>
        )}
      </div>

      <nav
        className={cn(
          'flex-1 space-y-1 p-3',
          open ? 'overflow-y-auto' : 'overflow-visible',
        )}
      >
        {items.map((item) => {
          const Icon = item.icon
          const children = item.children || []
          const hasChildren = children.length > 0
          const childActive = children.some((c) =>
            isPathActive(pathname, c.path),
          )
          const isExpanded = Boolean(expanded[item.key]) || childActive

          if (!hasChildren) {
            const link = (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary text-white shadow-sm shadow-primary/20'
                      : 'text-slate-600 hover:bg-slate-100',
                    !open && 'justify-center px-2',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {open ? <span>{item.label}</span> : null}
              </NavLink>
            )

            if (!open) {
              return (
                <NavTooltip key={item.key} label={item.label}>
                  {link}
                </NavTooltip>
              )
            }

            return link
          }

          if (!open) {
            return (
              <CollapsedSubmenuFlyout
                key={item.key}
                item={item}
                pathname={pathname}
                childActive={childActive}
              />
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
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors',
                  childActive || isExpanded
                    ? 'text-slate-900 hover:bg-slate-100'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
                aria-expanded={isExpanded}
              >
                <Icon className="h-5 w-5 shrink-0" />
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
                          <ChildIcon className="h-4 w-4 shrink-0 opacity-80" />
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
