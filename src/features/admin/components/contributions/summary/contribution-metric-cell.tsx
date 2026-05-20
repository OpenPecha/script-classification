import { roundPercent } from './contribution-percent'

export interface ContributionMetricCellProps {
  count: number
  denominator: number
  filterActive: boolean
  showPercent?: boolean
}

export function ContributionMetricCell({
  count,
  denominator,
  filterActive,
  showPercent = true,
}: ContributionMetricCellProps) {
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
