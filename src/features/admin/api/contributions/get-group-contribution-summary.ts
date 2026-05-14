import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import type {
  ContributionSummaryQueryParams,
  GroupContributionSummaryResponse,
} from '@/types'
import { contributionKeys } from './contribution-keys'

const CONTRIBUTIONS_STALE_MS = 20 * 60 * 1000

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

export interface GroupContributionSummaryPair {
  overall: GroupContributionSummaryResponse
  filtered: GroupContributionSummaryResponse
}

export function useGroupContributionSummaryPair(options: {
  groupId: string | undefined
  period: { start: string; end: string }
  enabled: boolean
}) {
  const { groupId, period, enabled } = options

  return useQuery({
    queryKey: contributionKeys.summaryPair(
      groupId ?? 'none',
      period.start,
      period.end
    ),
    queryFn: async (): Promise<GroupContributionSummaryPair> => {
      const id = groupId as string
      const range: ContributionSummaryQueryParams = {
        start_date: period.start,
        end_date: period.end,
      }
      const [overall, filtered] = await Promise.all([
        getGroupContributionSummary(id),
        getGroupContributionSummary(id, range),
      ])
      return { overall, filtered }
    },
    enabled: Boolean(groupId) && enabled,
    staleTime: CONTRIBUTIONS_STALE_MS,
    retry: 1,
  })
}
