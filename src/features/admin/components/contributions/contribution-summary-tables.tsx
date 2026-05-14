import { useTranslation } from 'react-i18next'
import type {
  AnnotatorContributionRow,
  GroupContributionSummaryResponse,
  ReviewerContributionRow,
} from '@/types'

function MetricPair({ overall, filtered }: { overall: number; filtered: number }) {
  return (
    <span className="tabular-nums">
      {overall}{' '}
      <span className="text-muted-foreground">(</span>
      <span className="font-medium text-emerald-600 dark:text-emerald-400">{filtered}</span>
      <span className="text-muted-foreground">)</span>
    </span>
  )
}

interface ContributionSummaryTablesProps {
  overall: GroupContributionSummaryResponse
  filtered: GroupContributionSummaryResponse
  /** When set, shows a hint that parenthetical values cover this many days (non-admin). */
  filteredWindowDaysForHint?: number
}

export function ContributionSummaryTables({
  overall,
  filtered,
  filteredWindowDaysForHint,
}: ContributionSummaryTablesProps) {
  const { t } = useTranslation('admin')

  const annotOverallById = new Map(
    overall.annotator.map((r) => [r.user_id, r] as const)
  )
  const revOverallById = new Map(
    overall.reviewer.map((r) => [r.user_id, r] as const)
  )

  return (
    <div className="space-y-6">
      {filteredWindowDaysForHint != null ? (
        <p className="text-sm text-muted-foreground" style={{ color: 'white' }}>
          {t('userContributions.nonAdminFilteredHint', { count: filteredWindowDaysForHint })}
        </p>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.annotatorsSection')}</h3>
        {filtered.annotator.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
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
                {filtered.annotator.map((row) => (
                  <AnnotatorRow
                    key={row.user_id}
                    filtered={row}
                    overall={annotOverallById.get(row.user_id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.reviewersSection')}</h3>
        {filtered.reviewer.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4">
            {t('userContributions.noReviewers')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
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
                    {t('userContributions.tables.reviewer.totalRejection')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.reviewer.map((row) => (
                  <ReviewerRow
                    key={row.user_id}
                    filtered={row}
                    overall={revOverallById.get(row.user_id)}
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
  filtered,
  overall,
}: {
  filtered: AnnotatorContributionRow
  overall: AnnotatorContributionRow | undefined
}) {
  const o = overall ?? filtered
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">{filtered.username}</td>
      <td className="px-3 py-2">
        <MetricPair overall={o.total_annotated} filtered={filtered.total_annotated} />
      </td>
      <td className="px-3 py-2">
        <MetricPair overall={o.reviewed_count} filtered={filtered.reviewed_count} />
      </td>
      <td className="px-3 py-2">
        <MetricPair overall={o.approved_count} filtered={filtered.approved_count} />
      </td>
    </tr>
  )
}

function ReviewerRow({
  filtered,
  overall,
}: {
  filtered: ReviewerContributionRow
  overall: ReviewerContributionRow | undefined
}) {
  const o = overall ?? filtered
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">{filtered.username}</td>
      <td className="px-3 py-2">
        <MetricPair overall={o.total_reviewed} filtered={filtered.total_reviewed} />
      </td>
      <td className="px-3 py-2">
        <MetricPair overall={o.verified_count} filtered={filtered.verified_count} />
      </td>
      <td className="px-3 py-2">
        <MetricPair overall={o.total_rejection} filtered={filtered.total_rejection} />
      </td>
    </tr>
  )
}
