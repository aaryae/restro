import { useQuery } from '@tanstack/react-query'
import { fetchPlatformSmtp } from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'

export function usePlatformSmtp(enabled = true) {
  return useQuery({
    queryKey: queryKeys.smtp,
    queryFn: fetchPlatformSmtp,
    enabled,
  })
}
