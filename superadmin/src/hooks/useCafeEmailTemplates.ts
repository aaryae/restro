import { useQuery } from '@tanstack/react-query'
import { fetchCafeEmailTemplates } from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'

export function useCafeEmailTemplates(enabled = true) {
  return useQuery({
    queryKey: queryKeys.emailTemplates,
    queryFn: fetchCafeEmailTemplates,
    enabled,
  })
}
