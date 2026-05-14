import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  contributionKeys,
  useGroupContributionSummaryPair,
} from '@/features/admin/api/contributions'
import {
  CONTRIBUTION_DEFAULT_FILTERED_DAYS,
  getRollingInclusiveDaysRange,
} from '@/lib/contribution-date-range'
import { AdminContributionsDateFilter } from './admin-contributions-date-filter'
import { ContributionSummaryTables } from './contribution-summary-tables'

interface AdminGroupContributionRowProps {
  groupId: string
  groupName: string
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

export function AdminGroupContributionRow({ groupId, groupName }: AdminGroupContributionRowProps) {
  const { t } = useTranslation('admin')
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const defaultPeriod = useMemo(
    () => getRollingInclusiveDaysRange(CONTRIBUTION_DEFAULT_FILTERED_DAYS),
    []
  )
  const [appliedPeriod, setAppliedPeriod] = useState(defaultPeriod)
  const [draftStart, setDraftStart] = useState(defaultPeriod.start)
  const [draftEnd, setDraftEnd] = useState(defaultPeriod.end)
  const [validationError, setValidationError] = useState<string | null>(null)

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
    setAppliedPeriod({ start: draftStart, end: draftEnd })
    invalidateThisGroup()
  }, [draftEnd, draftStart, invalidateThisGroup, t])

  const handleClear = useCallback(() => {
    const next = getRollingInclusiveDaysRange(CONTRIBUTION_DEFAULT_FILTERED_DAYS)
    setAppliedPeriod(next)
    setDraftStart(next.start)
    setDraftEnd(next.end)
    setValidationError(null)
    invalidateThisGroup()
  }, [invalidateThisGroup])

  const { data, isLoading, isFetching, error, refetch } = useGroupContributionSummaryPair({
    groupId,
    period: appliedPeriod,
    enabled: open,
  })

  const httpStatus = isAxiosError(error) ? error.response?.status : undefined

  const inputIdPrefix = useMemo(() => `contrib-group-${groupId.replace(/[^a-zA-Z0-9-]/g, '')}`, [groupId])

  const showLoading = isLoading || (isFetching && !data)
  const showDateFilter =
    Boolean(data) || (Boolean(error) && httpStatus === 400)

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

  return (
    <div className="rounded-lg border border-border">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-between gap-2 rounded-none px-4 py-3 text-left font-medium hover:bg-muted/80"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="truncate">{groupName}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </Button>

      {open ? (
        <div className="space-y-4 border-t border-border p-4">
          {showLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error && httpStatus !== 400 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {contributionUnavailableMessage(error, t)}
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
                {t('userContributions.refresh')}
              </Button>
            </div>
          ) : error && httpStatus === 400 ? (
            <div className="space-y-4">
              {dateFilterBlock}
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-sm text-destructive">{contributionUnavailableMessage(error, t)}</p>
              </div>
            </div>
          ) : data ? (
            <>
              {dateFilterBlock}
              <ContributionSummaryTables overall={data.overall} filtered={data.filtered} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
