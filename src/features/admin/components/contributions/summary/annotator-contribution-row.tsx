import type { ReactNode } from 'react'
import type { AnnotatorContributionRow } from '@/types'
import { ContributionMetricCell } from './contribution-metric-cell'

export interface AnnotatorContributionRowProps {
  filterActive: boolean
  display: AnnotatorContributionRow
  baseline: AnnotatorContributionRow
}

export function AnnotatorContributionTableRow({
  filterActive,
  display,
  baseline,
}: AnnotatorContributionRowProps) {
  const totalAnnotated = baseline.total_annotated
  const totalReviewed = baseline.reviewed_count

  const annotatedCell: ReactNode = filterActive ? (
    <ContributionMetricCell
      count={display.total_annotated}
      denominator={totalAnnotated}
      filterActive
    />
  ) : (
    <span className="tabular-nums">{baseline.total_annotated}</span>
  )

  const reviewedCell: ReactNode = filterActive ? (
    <ContributionMetricCell
      count={display.reviewed_count}
      denominator={totalReviewed}
      filterActive
    />
  ) : (
    <ContributionMetricCell
      count={baseline.reviewed_count}
      denominator={totalAnnotated}
      filterActive={false}
    />
  )

  const approvedCell: ReactNode = filterActive ? (
    <span className="tabular-nums">{display.approved_count}</span>
  ) : (
    <ContributionMetricCell
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
