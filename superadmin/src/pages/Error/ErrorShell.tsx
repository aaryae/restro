import serveLogo from '@/assets/logo.png'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Home } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  code: string
  title: string
  description: string
  accent?: 'primary' | 'danger'
  actions?: ReactNode
  detail?: ReactNode
}

export function ErrorShell({
  code,
  title,
  description,
  accent = 'primary',
  actions,
  detail,
}: Props) {
  const isDanger = accent === 'danger'

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#eef3f9]">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
          backgroundSize: '28px 28px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)',
        }}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute -left-32 top-[-10%] h-[28rem] w-[28rem] rounded-full blur-3xl animate-error-orb',
          isDanger ? 'bg-red-400/25' : 'bg-[#032768]/20',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute -right-24 bottom-[-8%] h-[26rem] w-[26rem] rounded-full blur-3xl animate-error-orb-delayed',
          isDanger ? 'bg-orange-300/20' : 'bg-[#ffba00]/25',
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/70 to-transparent"
        aria-hidden
      />

      {/* Brand bar — separate from content so it never collides */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center transition hover:opacity-80"
        >
          <img
            src={serveLogo}
            alt="Serve" 
            className="h-9 w-auto object-contain sm:h-10"
          />
        </Link>
   
      </header>

      {/* Stage */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        <div className="relative w-full max-w-xl">
          {/* Giant watermark code */}
          <p
            className={cn(
              'pointer-events-none absolute inset-x-0 -top-10 select-none text-center text-[7.5rem] font-semibold leading-none tracking-tighter sm:-top-14 sm:text-[10rem]',
              'animate-error-code-rise',
              isDanger ? 'text-red-600/[0.07]' : 'text-[#032768]/[0.08]',
            )}
            aria-hidden
          >
            {code}
          </p>

          <div className="relative animate-error-enter overflow-hidden rounded-3xl border border-white/80 bg-white/85 p-7 shadow-[0_24px_60px_-28px_rgba(3,39,104,0.35)] backdrop-blur-md sm:p-10">
            {/* Accent strip */}
            <div
              className={cn(
                'absolute inset-x-0 top-0 h-1',
                isDanger
                  ? 'bg-gradient-to-r from-red-500 via-orange-400 to-red-400'
                  : 'bg-gradient-to-r from-[#032768] via-[#1a4a9e] to-[#ffba00]',
              )}
            />

            <div
              className={cn(
                'mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide animate-error-chip',
                isDanger
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
                  : 'bg-[#e8eef8] text-[#032768] ring-1 ring-[#d0dbed]',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full animate-error-dot',
                  isDanger ? 'bg-red-500' : 'bg-[#ffba00]',
                )}
              />
              {isDanger ? 'Something went wrong' : 'Lost your way'}
            </div>

            <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.85rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-slate-500 sm:text-[15px]">
              {description}
            </p>

            {detail ? (
              <div className="mt-5 max-h-28 overflow-auto rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 text-left">
                {detail}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              {actions ?? (
                <>
                  <Button
                    className="h-11 w-full rounded-xl px-5 sm:w-auto"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go back
                  </Button>
                  <Link to="/" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl px-5 sm:w-auto"
                    >
                      <Home className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400 animate-error-fade">
            Serve platform · control plane
          </p>
        </div>
      </div>
    </main>
  )
}
