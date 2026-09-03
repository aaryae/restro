import { QueryCache, QueryClient } from '@tanstack/react-query'
import { forceLoginRedirect, isSessionFailure } from '@/api/client'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isSessionFailure(error)) forceLoginRedirect()
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isSessionFailure(error)) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})

export const queryKeys = {
  me: ['platform', 'me'] as const,
  stats: ['platform', 'stats'] as const,
  statsTrends: (params: unknown) =>
    ['platform', 'stats', 'trends', params] as const,
  cafes: (params: unknown) => ['platform', 'cafes', params] as const,
  cafe: (id: string | number) => ['platform', 'cafe', String(id)] as const,
  audit: (params: unknown) => ['platform', 'audit', params] as const,
  users: (params: unknown) => ['platform', 'users', params] as const,
  smtp: ['platform', 'smtp'] as const,
  emailTemplates: ['platform', 'cafe-email-templates'] as const,
}
