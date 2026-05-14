/** YYYY-MM-DD in local calendar */
function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Default filtered window for contribution summaries (rolling, inclusive both ends). */
export const CONTRIBUTION_DEFAULT_FILTERED_DAYS = 30

/**
 * Rolling window ending on `reference`'s calendar date: `days` distinct calendar days,
 * both **start** and **end** inclusive (matches batch API: start_date and end_date inclusive).
 * Example: days=30 → end is today, start is 29 calendar days earlier (30 days total).
 */
export function getRollingInclusiveDaysRange(
  days: number,
  reference = new Date()
): { start: string; end: string } {
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return { start: formatYmd(start), end: formatYmd(end) }
}

/** First day of current month → first day of next month (legacy month UI; end was exclusive-API style). Prefer {@link getRollingInclusiveDaysRange} for contributions. */
export function getDefaultCalendarMonthRange(reference = new Date()): {
  start: string
  end: string
} {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1)
  return { start: formatYmd(start), end: formatYmd(end) }
}
