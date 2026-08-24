import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isUnauthorized(error)) return false
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
}
