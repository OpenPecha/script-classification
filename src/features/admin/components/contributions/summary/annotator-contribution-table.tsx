import { useTranslation } from 'react-i18next'
import type { AnnotatorContributionRow } from '@/types'
import { AnnotatorContributionTableRow } from './annotator-contribution-row'

export interface AnnotatorContributionTableProps {
  rows: AnnotatorContributionRow[]
  baselineByUserId: Map<string, AnnotatorContributionRow>
  filterActive: boolean
}

export function AnnotatorContributionTable({
  rows,
  baselineByUserId,
  filterActive,
}: AnnotatorContributionTableProps) {
  const { t } = useTranslation('admin')

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {t('userContributions.noAnnotators')}
      </p>
    )
  }

  return (
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
          {rows.map((row) => (
            <AnnotatorContributionTableRow
              key={row.user_id}
              filterActive={filterActive}
              display={row}
              baseline={baselineByUserId.get(row.user_id) ?? row}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
