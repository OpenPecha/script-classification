import type { ReactNode } from 'react'
import type { ReviewerContributionRow } from '@/types'
import { ContributionMetricCell } from './contribution-metric-cell'

export interface ReviewerContributionRowProps {
  filterActive: boolean
  display: ReviewerContributionRow
  baseline: ReviewerContributionRow
}

export function ReviewerContributionTableRow({
  filterActive,
  display,
  baseline,
}: ReviewerContributionRowProps) {
  const totalReviewed = baseline.total_reviewed
  const verifiedBaseline = baseline.verified_count

  const totalReviewedCell: ReactNode = filterActive ? (
    <ContributionMetricCell
      count={display.total_reviewed}
      denominator={totalReviewed}
      filterActive
    />
  ) : (
    <span className="tabular-nums">{baseline.total_reviewed}</span>
  )

  const verifiedCell: ReactNode = filterActive ? (
    <ContributionMetricCell
      count={display.verified_count}
      denominator={totalReviewed}
      filterActive
    />
  ) : (
    <ContributionMetricCell
      count={baseline.verified_count}
      denominator={totalReviewed}
      filterActive={false}
    />
  )

  const rejectedTasksCell: ReactNode = filterActive ? (
    <ContributionMetricCell
      count={display.rejected_tasks}
      denominator={verifiedBaseline}
      filterActive
    />
  ) : (
    <ContributionMetricCell
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
