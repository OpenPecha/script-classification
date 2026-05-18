import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  contributionKeys,
  useGroupContributionSummaryFiltered,
  useGroupContributionSummaryOverall,
} from '@/features/admin/api/contributions'
import {
  CONTRIBUTION_DEFAULT_FILTERED_DAYS,
  getRollingInclusiveDaysRange,
} from '@/lib/contribution-date-range'
import { AdminContributionsDateFilter } from './admin-contributions-date-filter'
import { ContributionSummaryTables } from './contribution-summary-tables'

export interface AdminGroupContributionRowProps {
  groupId: string
  groupName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  appliedPeriod: { start: string; end: string } | undefined
  onApplyPeriod: (period: { start: string; end: string }) => void
  onClearPeriod: () => void
}

function contributionUnavailableMessage(
  error: unknown,
  t: (key: string) => string
): string {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 404) return t('userContributions.groupNotFound')
  if (status === 400) return t('userContributions.invalidDateRange')
  return t('userContributions.featureNotImplementedForGroup')
}

export function AdminGroupContributionRow({
  groupId,
  groupName,
  isOpen,
  onOpenChange,
  appliedPeriod,
  onApplyPeriod,
  onClearPeriod,
}: AdminGroupContributionRowProps) {
  const { t } = useTranslation('admin')
  const queryClient = useQueryClient()

  const rollingDefault = useMemo(
    () => getRollingInclusiveDaysRange(CONTRIBUTION_DEFAULT_FILTERED_DAYS),
    []
  )

  const [draftStart, setDraftStart] = useState(rollingDefault.start)
  const [draftEnd, setDraftEnd] = useState(rollingDefault.end)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (appliedPeriod) {
      setDraftStart(appliedPeriod.start)
      setDraftEnd(appliedPeriod.end)
    } else {
      setDraftStart(rollingDefault.start)
      setDraftEnd(rollingDefault.end)
    }
  }, [isOpen, appliedPeriod, rollingDefault.start, rollingDefault.end])

  const invalidateThisGroup = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: contributionKeys.summaryPairsForGroup(groupId),
    })
  }, [groupId, queryClient])

  const handleApply = useCallback(() => {
    if (!draftStart || !draftEnd) {
      setValidationError(t('userContributions.validationDatesRequired'))
      return
    }
    if (draftStart > draftEnd) {
      setValidationError(t('userContributions.validationStartBeforeEnd'))
      return
    }
    setValidationError(null)
    onApplyPeriod({ start: draftStart, end: draftEnd })
    invalidateThisGroup()
  }, [draftEnd, draftStart, invalidateThisGroup, onApplyPeriod, t])

  const handleClear = useCallback(() => {
    setValidationError(null)
    onClearPeriod()
    invalidateThisGroup()
  }, [invalidateThisGroup, onClearPeriod])

  const filterActive = Boolean(appliedPeriod)

  const overallQuery = useGroupContributionSummaryOverall({
    groupId,
    enabled: isOpen,
  })

  const filteredQuery = useGroupContributionSummaryFiltered({
    groupId,
    period: appliedPeriod ?? rollingDefault,
    enabled: isOpen && filterActive,
  })

  const overallHttp = isAxiosError(overallQuery.error)
    ? overallQuery.error.response?.status
    : undefined
  const filteredHttp = isAxiosError(filteredQuery.error)
    ? filteredQuery.error.response?.status
    : undefined

  const refetchAll = useCallback(() => {
    void overallQuery.refetch()
    if (filterActive) void filteredQuery.refetch()
  }, [filterActive, filteredQuery, overallQuery])

  const inputIdPrefix = useMemo(
    () => `contrib-group-${groupId.replace(/[^a-zA-Z0-9-]/g, '')}`,
    [groupId]
  )

  const showLoading =
    (overallQuery.isLoading || (overallQuery.isFetching && !overallQuery.data)) ||
    (filterActive &&
      (filteredQuery.isLoading || (filteredQuery.isFetching && !filteredQuery.data)) &&
      !filteredQuery.error)

  const hasOverall = Boolean(overallQuery.data)
  const showDateFilter =
    hasOverall ||
    (filterActive && Boolean(filteredQuery.error) && filteredHttp === 400)

  const dateFilterBlock = showDateFilter ? (
    <AdminContributionsDateFilter
      inputIdPrefix={inputIdPrefix}
      draftStart={draftStart}
      draftEnd={draftEnd}
      onDraftStartChange={setDraftStart}
      onDraftEndChange={setDraftEnd}
      onApply={handleApply}
      onClear={handleClear}
      validationError={validationError}
    />
  ) : null

  const overallErrBlock =
    overallQuery.error && overallHttp !== 400 ? (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {contributionUnavailableMessage(overallQuery.error, t)}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetchAll()}>
          {t('userContributions.refresh')}
        </Button>
      </div>
    ) : null

  const filteredErrNon400 =
    filterActive && filteredQuery.error && filteredHttp !== 400 ? (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {contributionUnavailableMessage(filteredQuery.error, t)}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetchAll()}>
          {t('userContributions.refresh')}
        </Button>
      </div>
    ) : null

  const filtered400Block =
    filterActive && filteredQuery.error && filteredHttp === 400 ? (
      <div className="space-y-4">
        {dateFilterBlock}
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm text-destructive">
            {contributionUnavailableMessage(filteredQuery.error, t)}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetchAll()}>
            {t('userContributions.refresh')}
          </Button>
        </div>
      </div>
    ) : null

  const tablesBlock =
    overallQuery.data && (!filterActive || filteredQuery.data) ? (
      <>
        {dateFilterBlock}
        <ContributionSummaryTables
          baseline={overallQuery.data}
          filtered={filterActive ? filteredQuery.data ?? null : null}
          filterActive={filterActive && Boolean(filteredQuery.data)}
        />
      </>
    ) : null

  return (
    <div className="rounded-lg border border-border">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-between gap-2 rounded-none px-4 py-3 text-left font-medium hover:bg-muted/80"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="truncate">{groupName}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
        />
      </Button>

      {isOpen ? (
        <div className="space-y-4 border-t border-border p-4">
          {showLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : overallErrBlock ? (
            overallErrBlock
          ) : filteredErrNon400 ? (
            filteredErrNon400
          ) : filtered400Block ? (
            filtered400Block
          ) : tablesBlock ? (
            tablesBlock
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
