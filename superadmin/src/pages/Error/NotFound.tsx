import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorShell } from '@/pages/Error/ErrorShell'

export default function NotFoundPage() {
  return (
    <ErrorShell
      code="404"
      title="This page doesn’t exist"
      description="The link may be mistyped, outdated, or the route was removed. Head back and try another path."
      actions={
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
      }
    />
  )
}
