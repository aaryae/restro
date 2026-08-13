import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'
import { sideMenuItems } from '@/layout/sideMenu'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-[#f2f6fa]">
      <div
        className={cn(
          'fixed left-0 top-0 z-50 hidden h-screen border-r border-slate-200/80 transition-all duration-300 md:block',
          sidebarOpen ? 'w-80' : 'w-20',
        )}
      >
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />
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
            <nav className="space-y-1 p-3">
              {sideMenuItems.map((item) => {
                const Icon = item.icon
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
