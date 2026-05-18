import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import type {
  ContributionSummaryQueryParams,
  GroupContributionSummaryResponse,
} from '@/types'
import { contributionKeys } from './contribution-keys'

const CONTRIBUTIONS_CACHE_MS = 30 * 60 * 1000

export async function getGroupContributionSummary(
  groupId: string,
  params?: ContributionSummaryQueryParams
): Promise<GroupContributionSummaryResponse> {
  const search = new URLSearchParams()
  if (params) {
    search.set('start_date', params.start_date)
    search.set('end_date', params.end_date)
  }
  const qs = search.toString()
  return apiClient.get(
    `/contributions/${encodeURIComponent(groupId)}/summary${qs ? `?${qs}` : ''}`
  )
}

export function useGroupContributionSummaryOverall(options: {
  groupId: string | undefined
  enabled: boolean
}) {
  const { groupId, enabled } = options

  return useQuery({
    queryKey: contributionKeys.summaryOverall(groupId ?? 'none'),
    queryFn: () => getGroupContributionSummary(groupId as string),
    enabled: Boolean(groupId) && enabled,
    staleTime: CONTRIBUTIONS_CACHE_MS,
    gcTime: CONTRIBUTIONS_CACHE_MS,
    retry: 1,
  })
}

export function useGroupContributionSummaryFiltered(options: {
  groupId: string | undefined
  period: { start: string; end: string }
  enabled: boolean
}) {
  const { groupId, period, enabled } = options

  return useQuery({
    queryKey: contributionKeys.summaryFiltered(
      groupId ?? 'none',
      period.start,
      period.end
    ),
    queryFn: () =>
      getGroupContributionSummary(groupId as string, {
        start_date: period.start,
        end_date: period.end,
      }),
    enabled: Boolean(groupId) && enabled,
    staleTime: CONTRIBUTIONS_CACHE_MS,
    gcTime: CONTRIBUTIONS_CACHE_MS,
    retry: 1,
  })
}
