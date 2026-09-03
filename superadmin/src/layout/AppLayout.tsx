import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'
import { sideMenuItems, type SideMenuItem } from '@/layout/sideMenu'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'

const SIDEBAR_STORAGE_KEY = 'serve_superadmin_sidebar_open'

function readSidebarOpen() {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
  if (stored === '0') return false
  if (stored === '1') return true
  return true
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

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const { can } = useAuth()
  const { pathname } = useLocation()

  function toggleSidebar() {
    setSidebarOpen((current) => {
      const next = !current
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  const mobileItems = sideMenuItems
    .filter((item) => itemVisible(item, can))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => itemVisible(child, can)),
    }))

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev }
      for (const item of mobileItems) {
        if (!item.children?.length) continue
        if (isPathActive(pathname, item.path, item.path === '/')) {
          next[item.key] = true
        }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <div className="min-h-screen w-full bg-[#f2f6fa]">
      <div
        className={cn(
          'fixed left-0 top-0 z-50 hidden h-screen border-r border-slate-200/80 transition-all duration-300 md:block',
          sidebarOpen ? 'w-80 overflow-hidden' : 'w-20 overflow-visible',
        )}
      >
        <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <p className="font-semibold text-slate-900">Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1 overflow-y-auto p-3">
              {mobileItems.map((item) => {
                const Icon = item.icon
                const children = item.children || []
                const hasChildren = children.length > 0
                const childActive = children.some((c) =>
                  isPathActive(pathname, c.path),
                )
                const isExpanded = Boolean(expanded[item.key]) || childActive

                if (!hasChildren) {
                  return (
                    <NavLink
                      key={item.key}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-slate-600 hover:bg-slate-100',
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
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
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                      aria-expanded={isExpanded}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-slate-400 transition-transform duration-300 ease-out',
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
                                onClick={() => setMobileOpen(false)}
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
                                      ? 'bg-primary text-white'
                                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                                  )
                                }
                              >
                                <ChildIcon className="h-3.5 w-3.5 opacity-80" />
                                {child.label}
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
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'min-h-screen min-w-0 transition-all duration-300',
          sidebarOpen
            ? 'md:ml-80 md:w-[calc(100%-20rem)]'
            : 'md:ml-20 md:w-[calc(100%-5rem)]',
        )}
      >
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="relative min-h-[calc(100vh-4rem)] min-w-0 overflow-x-auto p-4 md:px-6 md:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
