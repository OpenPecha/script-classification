import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import type { User } from '@/types'
import { contributionKeys } from './contribution-keys'

const PROFILE_STALE_MS = 20 * 60 * 1000

export async function fetchUserByIdentifier(email: string): Promise<User> {
  const date = new Date().toISOString()
  return apiClient.get(
    `/user/by-identifier/${encodeURIComponent(email)}?date=${encodeURIComponent(date)}`
  )
}

export function useUserByIdentifier(email: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: contributionKeys.userByIdentifier(email ?? ''),
    queryFn: () => fetchUserByIdentifier(email as string),
    enabled: Boolean(email) && enabled,
    staleTime: PROFILE_STALE_MS,
    retry: 1,
  })
}
