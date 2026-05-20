export function roundPercent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 100)
}
