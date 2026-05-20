import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useGetGroups } from '@/features/admin/api/group'
import {
  contributionKeys,
  useGroupContributionSummaryFiltered,
  useGroupContributionSummaryOverall,
  useUserByIdentifier,
} from '@/features/admin/api/contributions'
import {
  CONTRIBUTION_DEFAULT_FILTERED_DAYS,
  getRollingInclusiveDaysRange,
} from '@/lib/contribution-date-range'
import {
  decodeAdminPeriodsParam,
  encodeAdminPeriodsMap,
  isNonAdminMode,
  isValidInclusiveRange,
  NON_ADMIN_MODE_HISTORY,
  NON_ADMIN_MODE_ROLLING30,
  parseAdminExpandedIds,
  serializeAdminExpandedIds,
  USER_CONTRIB_ADMIN_EXPAND,
  USER_CONTRIB_ADMIN_PERIODS,
  USER_CONTRIB_NON_ADMIN_END,
  USER_CONTRIB_NON_ADMIN_MODE,
  USER_CONTRIB_NON_ADMIN_START,
} from '@/lib/user-contributions-url'
import { UserRole } from '@/types'
import { LoadingSpinner } from '@/components/common'
import { Button } from '@/components/ui/button'
import { AdminGroupContributionRow } from './admin-group-contribution-row'
import { ContributionSummaryTables } from './summary'

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
  const [searchParams, setSearchParams] = useSearchParams()

  const profileQuery = useUserByIdentifier(email, Boolean(email))

  const groupId = profileQuery.data?.group_id
  const groupReady = hasGroupId(groupId)

  const modeRaw = searchParams.get(USER_CONTRIB_NON_ADMIN_MODE)
  const mode = isNonAdminMode(modeRaw) ? modeRaw : NON_ADMIN_MODE_ROLLING30
  const startQ = searchParams.get(USER_CONTRIB_NON_ADMIN_START) ?? ''
  const endQ = searchParams.get(USER_CONTRIB_NON_ADMIN_END) ?? ''

  const periodFromUrl =
    mode === NON_ADMIN_MODE_ROLLING30 && isValidInclusiveRange(startQ, endQ)
      ? { start: startQ, end: endQ }
      : getRollingInclusiveDaysRange(CONTRIBUTION_DEFAULT_FILTERED_DAYS)

  const filterActive = mode === NON_ADMIN_MODE_ROLLING30

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false

    if (!isNonAdminMode(modeRaw)) {
      next.set(USER_CONTRIB_NON_ADMIN_MODE, NON_ADMIN_MODE_ROLLING30)
      changed = true
    }

    const effectiveMode = isNonAdminMode(modeRaw) ? modeRaw : NON_ADMIN_MODE_ROLLING30

    if (effectiveMode === NON_ADMIN_MODE_ROLLING30) {
      const s = searchParams.get(USER_CONTRIB_NON_ADMIN_START)
      const e = searchParams.get(USER_CONTRIB_NON_ADMIN_END)
      const r = getRollingInclusiveDaysRange(CONTRIBUTION_DEFAULT_FILTERED_DAYS)
      if (!isValidInclusiveRange(s ?? '', e ?? '')) {
        next.set(USER_CONTRIB_NON_ADMIN_START, r.start)
        next.set(USER_CONTRIB_NON_ADMIN_END, r.end)
        changed = true
      }
    } else {
      if (searchParams.has(USER_CONTRIB_NON_ADMIN_START)) {
        next.delete(USER_CONTRIB_NON_ADMIN_START)
        changed = true
      }
      if (searchParams.has(USER_CONTRIB_NON_ADMIN_END)) {
        next.delete(USER_CONTRIB_NON_ADMIN_END)
        changed = true
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [modeRaw, searchParams, setSearchParams])

  const overallQuery = useGroupContributionSummaryOverall({
    groupId: groupReady ? groupId : undefined,
    enabled: groupReady && profileQuery.isSuccess,
  })

  const filteredQuery = useGroupContributionSummaryFiltered({
    groupId: groupReady ? groupId : undefined,
    period: periodFromUrl,
    enabled: groupReady && profileQuery.isSuccess && filterActive,
  })

  const showFullPageSpinner =
    profileQuery.isLoading ||
    (groupReady && overallQuery.isLoading && !overallQuery.data) ||
    (groupReady &&
      filterActive &&
      Boolean(overallQuery.data) &&
      (filteredQuery.isLoading || (filteredQuery.isFetching && !filteredQuery.data)) &&
      !filteredQuery.error)

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: contributionKeys.userByIdentifier(email ?? 'none'),
    })
    void queryClient.invalidateQueries({
      queryKey: contributionKeys.all,
    })
  }, [email, queryClient])

  const setModeHistory = useCallback(() => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        n.set(USER_CONTRIB_NON_ADMIN_MODE, NON_ADMIN_MODE_HISTORY)
        n.delete(USER_CONTRIB_NON_ADMIN_START)
        n.delete(USER_CONTRIB_NON_ADMIN_END)
        return n
      },
      { replace: true }
    )
  }, [setSearchParams])

  const setModeRolling30 = useCallback(() => {
    const r = getRollingInclusiveDaysRange(CONTRIBUTION_DEFAULT_FILTERED_DAYS)
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        n.set(USER_CONTRIB_NON_ADMIN_MODE, NON_ADMIN_MODE_ROLLING30)
        n.set(USER_CONTRIB_NON_ADMIN_START, r.start)
        n.set(USER_CONTRIB_NON_ADMIN_END, r.end)
        return n
      },
      { replace: true }
    )
  }, [setSearchParams])

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
        <p className="text-sm text-muted-foreground">
          {t('userContributions.featureNotImplementedForGroup')}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void profileQuery.refetch()}
        >
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

  if (overallQuery.isError || !overallQuery.data) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {overallQuery.error
            ? summaryErrorMessage(overallQuery.error, t)
            : t('userContributions.featureNotImplementedForGroup')}
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => void overallQuery.refetch()}>
          {t('userContributions.refresh')}
        </Button>
      </div>
    )
  }

  if (filterActive && filteredQuery.isError) {
    return (
      <div className="space-y-4">
        <NonAdminModeToggle mode={mode} onHistory={setModeHistory} onRolling30={setModeRolling30} />
        <p className="text-lg font-semibold tracking-tight">{overallQuery.data.group_name}</p>
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {summaryErrorMessage(filteredQuery.error, t)}
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void filteredQuery.refetch()}>
            {t('userContributions.refresh')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <NonAdminModeToggle mode={mode} onHistory={setModeHistory} onRolling30={setModeRolling30} />
      <p className="text-lg font-semibold tracking-tight">{overallQuery.data.group_name}</p>
      <ContributionSummaryTables
        baseline={overallQuery.data}
        filtered={filterActive && filteredQuery.data ? filteredQuery.data : null}
        filterActive={filterActive && Boolean(filteredQuery.data)}
      />
    </div>
  )
}

function NonAdminModeToggle({
  mode,
  onHistory,
  onRolling30,
}: {
  mode: string
  onHistory: () => void
  onRolling30: () => void
}) {
  const { t } = useTranslation('admin')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('userContributions.nonAdminDataScopeLabel')}</span>
      <div className="inline-flex rounded-md border border-border p-0.5">
        <Button
          type="button"
          size="sm"
          variant={mode === NON_ADMIN_MODE_ROLLING30 ? 'default' : 'ghost'}
          className="rounded-sm"
          onClick={onRolling30}
        >
          {t('userContributions.nonAdminModeRolling30')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === NON_ADMIN_MODE_HISTORY ? 'default' : 'ghost'}
          className="rounded-sm"
          onClick={onHistory}
        >
          {t('userContributions.nonAdminModeHistory')}
        </Button>
      </div>
    </div>
  )
}

function AdminContributionsBody() {
  const { t } = useTranslation('admin')
  const { data: groups = [], isLoading: groupsLoading, isError: groupsError } = useGetGroups()
  const [searchParams, setSearchParams] = useSearchParams()

  const periodsMap = useMemo(
    () => decodeAdminPeriodsParam(searchParams.get(USER_CONTRIB_ADMIN_PERIODS)),
    [searchParams]
  )

  const expandedSet = useMemo(() => {
    const ids = parseAdminExpandedIds(searchParams.get(USER_CONTRIB_ADMIN_EXPAND))
    return new Set(ids)
  }, [searchParams])

  const setExpanded = useCallback(
    (groupId: string, open: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const ids = parseAdminExpandedIds(next.get(USER_CONTRIB_ADMIN_EXPAND))
          const set = new Set(ids)
          if (open) set.add(groupId)
          else set.delete(groupId)
          const ser = serializeAdminExpandedIds([...set])
          if (ser) next.set(USER_CONTRIB_ADMIN_EXPAND, ser)
          else next.delete(USER_CONTRIB_ADMIN_EXPAND)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setPeriodForGroup = useCallback(
    (groupId: string, period: { start: string; end: string } | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const map = decodeAdminPeriodsParam(next.get(USER_CONTRIB_ADMIN_PERIODS))
          if (period) map[groupId] = period
          else delete map[groupId]
          if (Object.keys(map).length === 0) next.delete(USER_CONTRIB_ADMIN_PERIODS)
          else next.set(USER_CONTRIB_ADMIN_PERIODS, encodeAdminPeriodsMap(map))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

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
        <AdminGroupContributionRow
          key={g.id}
          groupId={g.id}
          groupName={g.name}
          isOpen={expandedSet.has(g.id)}
          onOpenChange={(open) => setExpanded(g.id, open)}
          appliedPeriod={periodsMap[g.id]}
          onApplyPeriod={(period) => setPeriodForGroup(g.id, period)}
          onClearPeriod={() => setPeriodForGroup(g.id, null)}
        />
      ))}
    </div>
  )
}
