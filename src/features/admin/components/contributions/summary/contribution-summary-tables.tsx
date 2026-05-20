import { useTranslation } from 'react-i18next'
import type { GroupContributionSummaryResponse } from '@/types'
import { AnnotatorContributionTable } from './annotator-contribution-table'
import { ReviewerContributionTable } from './reviewer-contribution-table'

export interface ContributionSummaryTablesProps {
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

  const annotRows =
    filterActive && filtered ? filtered.annotator : baseline.annotator

  const revRows = filterActive && filtered ? filtered.reviewer : baseline.reviewer

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.annotatorsSection')}</h3>
        <AnnotatorContributionTable
          rows={annotRows}
          baselineByUserId={annotBaselineById}
          filterActive={filterActive}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('userContributions.reviewersSection')}</h3>
        <ReviewerContributionTable
          rows={revRows}
          baselineByUserId={revBaselineById}
          filterActive={filterActive}
        />
      </section>
    </div>
  )
}
