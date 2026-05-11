import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import type { AcceptedScriptTypeCount, BatchReport } from '@/types'
import { StackedProgressBar, getAcceptedPercentage } from './progress-bar'
import { BatchStatsFooter } from './batch-stats-footer'
import { ScriptTypeBreakdown } from './script-type-breakdown'

interface BatchStatsProps {
  batchId: string
  report: BatchReport | undefined
  isLoading: boolean
}

export function BatchStats({ batchId, report, isLoading }: BatchStatsProps) {
  const { t } = useTranslation('admin')

  if (isLoading) {
    return <BatchStatsSkeleton />
  }

  if (!report) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        {t('batches.failedToLoadStats')}
      </div>
    )
  }

  if (report.total_tasks === 0) {
    return (
      <div className="flex items-center justify-center h-16 bg-slate-50 rounded-lg text-sm text-muted-foreground border border-dashed">
        {t('batches.noTasksInBatch')}
      </div>
    )
  }

  const acceptedPercentage = getAcceptedPercentage(report)
  const acceptedScriptTypeCounts: AcceptedScriptTypeCount[] = Object.entries(report.script_types ?? {})
    .filter(([, count]) => typeof count === 'number' && Number.isFinite(count) && count > 0)
    .map(([script_type, count]) => ({ script_type, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-3">
      <StackedProgressBar report={report} />

      {acceptedScriptTypeCounts.length > 0 && (
        <ScriptTypeBreakdown
          counts={acceptedScriptTypeCounts}
          totalAccepted={report.accepted}
        />
      )}

      <BatchStatsFooter
        batchId={batchId}
        trashedCount={report.trashed}
        rejectedCount={report.total_rejection_count}
        verifiedCount={report.verified}
        acceptedPercentage={acceptedPercentage}
      />
    </div>
  )
}

function BatchStatsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  )
}
