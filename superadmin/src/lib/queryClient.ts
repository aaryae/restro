import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
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
