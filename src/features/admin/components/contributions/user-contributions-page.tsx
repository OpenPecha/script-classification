import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { useGetGroups } from '@/features/admin/api/group'
import {
  contributionKeys,
  useGroupContributionSummaryPair,
  useUserByIdentifier,
} from '@/features/admin/api/contributions'
import {
  CONTRIBUTION_DEFAULT_FILTERED_DAYS,
  getRollingInclusiveDaysRange,
} from '@/lib/contribution-date-range'
import { UserRole } from '@/types'
import { LoadingSpinner } from '@/components/common'
import { Button } from '@/components/ui/button'
import { AdminGroupContributionRow } from './admin-group-contribution-row'
import { ContributionSummaryTables } from './contribution-summary-tables'

function hasGroupId(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function summaryErrorMessage(error: unknown, t: (key: string) => string): string {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400) return t('userContributions.invalidDateRange')
  return t('userContributions.featureNotImplementedForGroup')
}

export function UserContributionsPage() {
  const { currentUser } = useAuth()
  const { t } = useTranslation('admin')

  const isAdmin = currentUser?.role === UserRole.Admin

  if (!currentUser?.role) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('userContributions.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('userContributions.description')}</p>
      </div>

      {isAdmin ? <AdminContributionsBody /> : <NonAdminContributionsBody />}
    </div>
  )
}

function NonAdminContributionsBody() {
  const { t } = useTranslation('admin')
  const { currentUser } = useAuth()
  const email = currentUser?.email
  const queryClient = useQueryClient()

  const profileQuery = useUserByIdentifier(email, Boolean(email))

  const defaultPeriod = useMemo(
    () => getRollingInclusiveDaysRange(CONTRIBUTION_DEFAULT_FILTERED_DAYS),
    []
  )

  const groupId = profileQuery.data?.group_id
  const groupReady = hasGroupId(groupId)

  const summaryQuery = useGroupContributionSummaryPair({
    groupId: groupReady ? groupId : undefined,
    period: defaultPeriod,
    enabled: groupReady && profileQuery.isSuccess,
  })

  const showFullPageSpinner =
    profileQuery.isLoading || (groupReady && summaryQuery.isLoading && !summaryQuery.data)

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: contributionKeys.userByIdentifier(email ?? 'none'),
    })
    void queryClient.invalidateQueries({
      queryKey: contributionKeys.summaryPairs(),
    })
  }, [email, queryClient])

  if (showFullPageSpinner) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t('userContributions.featureNotImplementedForGroup')}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void profileQuery.refetch()}>
          {t('userContributions.refresh')}
        </Button>
      </div>
    )
  }

  if (!groupReady) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t('userContributions.noGroupYet')}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={handleRefresh}>
          {t('userContributions.refresh')}
        </Button>
      </div>
    )
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {summaryQuery.error ? summaryErrorMessage(summaryQuery.error, t) : t('userContributions.featureNotImplementedForGroup')}
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void summaryQuery.refetch()}>
          {t('userContributions.refresh')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground" style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' } }>
        {summaryQuery.data.overall.group_name}
      </p>
      <ContributionSummaryTables
        overall={summaryQuery.data.overall}
        filtered={summaryQuery.data.filtered}
        filteredWindowDaysForHint={CONTRIBUTION_DEFAULT_FILTERED_DAYS}
      />
    </div>
  )
}

function AdminContributionsBody() {
  const { t } = useTranslation('admin')
  const { data: groups = [], isLoading: groupsLoading, isError: groupsError } = useGetGroups()

  if (groupsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (groupsError) {
    return (
      <p className="text-sm text-muted-foreground">{t('userContributions.groupsLoadError')}</p>
    )
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('userContributions.noGroups')}</p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{t('userContributions.adminExpandHint')}</p>
      {groups.map((g) => (
        <AdminGroupContributionRow key={g.id} groupId={g.id} groupName={g.name} />
      ))}
    </div>
  )
}
