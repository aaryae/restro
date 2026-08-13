import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorShell } from '@/pages/Error/ErrorShell'

function errorMessage(error: unknown): {
  title: string
  description: string
  detail?: string
} {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: 'This page doesn’t exist',
        description:
          'The link may be mistyped, outdated, or the route was removed. Head back and try another path.',
      }
    }
    return {
      title: error.statusText || 'Something went wrong',
      description: 'The app hit an unexpected response while loading this page.',
      detail: (() => {
        if (typeof error.data === 'string') return error.data
        if (
          error.data &&
          typeof error.data === 'object' &&
          'message' in error.data &&
          error.data.message != null
        ) {
          return String(error.data.message)
        }
        return undefined
      })(),
    }
  }

  if (error instanceof Error) {
    const isChunk =
      /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
        error.message,
      )
    if (isChunk) {
      return {
        title: 'App needs a refresh',
        description:
          'A newer UI build is available, or the session cache went stale. Reload once and you’ll be back.',
        detail: error.message,
      }
    }
    return {
      title: 'Unexpected error',
      description:
        'Something broke while rendering this screen. Reloading usually clears it.',
      detail: error.message,
    }
  }

  return {
    title: 'Unexpected error',
    description:
      'Something broke while rendering this screen. Reloading usually clears it.',
  }
}

export default function RouteErrorPage() {
  const error = useRouteError()
  const { title, description, detail } = errorMessage(error)
  const status =
    isRouteErrorResponse(error) && error.status ? String(error.status) : '500'

  return (
    <ErrorShell
      code={status}
      title={title}
      description={description}
      accent="danger"
      detail={
        detail ? (
          <p className="break-words font-mono text-[11px] leading-relaxed text-slate-600">
            {detail}
          </p>
        ) : undefined
      }
      actions={
        <>
          <Button
            className="h-11 w-full rounded-xl px-5 sm:w-auto"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Reload
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
      }
    />
  )
}
