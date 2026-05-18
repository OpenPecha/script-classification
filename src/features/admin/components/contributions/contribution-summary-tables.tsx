import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  AnnotatorContributionRow,
  GroupContributionSummaryResponse,
  ReviewerContributionRow,
} from '@/types'

function roundPercent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 100)
}

function MetricCell({
  count,
  denominator,
  filterActive,
  showPercent = true,
}: {
  count: number
  denominator: number
  filterActive: boolean
  showPercent?: boolean
}) {
  const p = showPercent ? roundPercent(count, denominator) : null
  const pctClass = filterActive
    ? 'font-medium text-emerald-600 dark:text-emerald-400'
    : 'text-muted-foreground'
  return (
    <span className="tabular-nums">
      {count}
      {p !== null ? (
        <>
          <span className="text-muted-foreground"> (</span>
          <span className={pctClass}>{p}%</span>
          <span className="text-muted-foreground">)</span>
        </>
      ) : null}
    </span>
  )
}

interface ContributionSummaryTablesProps {
  baseline: GroupContributionSummaryResponse
  filtered: GroupContributionSummaryResponse | null
  filterActive: boolean
}

export function ContributionSummaryTables({
  baseline,
  filtered,
  filterActive,
}: ContributionSummaryTablesProps) {
  const { t } = useTranslation('admin')

  const annotBaselineById = new Map(
    baseline.annotator.map((r) => [r.user_id, r] as const)
  )
  const revBaselineById = new Map(
    baseline.reviewer.map((r) => [r.user_id, r] as const)
  )

  const annotRows: AnnotatorContributionRow[] =
    filterActive && filtered ? filtered.annotator : baseline.annotator

  const revRows: ReviewerContributionRow[] =
    filterActive && filtered ? filtered.reviewer : baseline.reviewer

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.annotatorsSection')}</h3>
        {annotRows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {t('userContributions.noAnnotators')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.annotator.username')}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.annotator.totalAnnotated')}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.annotator.reviewedCount')}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.annotator.approvedCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {annotRows.map((row) => (
                  <AnnotatorRow
                    key={row.user_id}
                    filterActive={filterActive}
                    display={row}
                    baseline={annotBaselineById.get(row.user_id) ?? row}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.reviewersSection')}</h3>
        {revRows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {t('userContributions.noReviewers')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.reviewer.username')}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.reviewer.totalReviewed')}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.reviewer.verifiedCount')}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.reviewer.rejectedTasks')}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t('userContributions.tables.reviewer.totalRejection')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {revRows.map((row) => (
                  <ReviewerRow
                    key={row.user_id}
                    filterActive={filterActive}
                    display={row}
                    baseline={revBaselineById.get(row.user_id) ?? row}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function AnnotatorRow({
  filterActive,
  display,
  baseline,
}: {
  filterActive: boolean
  display: AnnotatorContributionRow
  baseline: AnnotatorContributionRow
}) {
  const totalAnnotated = baseline.total_annotated
  const totalReviewed = baseline.reviewed_count

  const annotatedCell: ReactNode = filterActive ? (
    <MetricCell count={display.total_annotated} denominator={totalAnnotated} filterActive />
  ) : (
    <span className="tabular-nums">{baseline.total_annotated}</span>
  )

  const reviewedCell: ReactNode = filterActive ? (
    <MetricCell count={display.reviewed_count} denominator={totalReviewed} filterActive />
  ) : (
    <MetricCell
      count={baseline.reviewed_count}
      denominator={totalAnnotated}
      filterActive={false}
    />
  )

  const approvedCell: ReactNode = filterActive ? (
    <span className="tabular-nums">{display.approved_count}</span>
  ) : (
    <MetricCell
      count={baseline.approved_count}
      denominator={totalReviewed}
      filterActive={false}
    />
  )

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">{display.username}</td>
      <td className="px-3 py-2">{annotatedCell}</td>
      <td className="px-3 py-2">{reviewedCell}</td>
      <td className="px-3 py-2">{approvedCell}</td>
    </tr>
  )
}

function ReviewerRow({
  filterActive,
  display,
  baseline,
}: {
  filterActive: boolean
  display: ReviewerContributionRow
  baseline: ReviewerContributionRow
}) {
  const totalReviewed = baseline.total_reviewed
  const verifiedBaseline = baseline.verified_count

  const totalReviewedCell: ReactNode = filterActive ? (
    <MetricCell count={display.total_reviewed} denominator={totalReviewed} filterActive />
  ) : (
    <span className="tabular-nums">{baseline.total_reviewed}</span>
  )

  const verifiedCell: ReactNode = filterActive ? (
    <MetricCell count={display.verified_count} denominator={totalReviewed} filterActive />
  ) : (
    <MetricCell
      count={baseline.verified_count}
      denominator={totalReviewed}
      filterActive={false}
    />
  )

  const rejectedTasksCell: ReactNode = filterActive ? (
    <MetricCell
      count={display.rejected_tasks}
      denominator={verifiedBaseline}
      filterActive
    />
  ) : (
    <MetricCell
      count={baseline.rejected_tasks}
      denominator={verifiedBaseline}
      filterActive={false}
    />
  )

  const rejectionCountCell: ReactNode = filterActive ? (
    <span className="tabular-nums">{display.total_rejection}</span>
  ) : (
    <span className="tabular-nums">{baseline.total_rejection}</span>
  )

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">{display.username}</td>
      <td className="px-3 py-2">{totalReviewedCell}</td>
      <td className="px-3 py-2">{verifiedCell}</td>
      <td className="px-3 py-2">{rejectedTasksCell}</td>
      <td className="px-3 py-2">{rejectionCountCell}</td>
    </tr>
  )
}
