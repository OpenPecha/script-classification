import { BATCH_STATS_CONFIG, WORKFLOW_STATS, type BatchStatKey, type BatchReport } from '@/types'
import type { ProgressSegmentData } from './progress-bar.types'

/**
 * Calculate percentage with precision
 */
export function calculatePercentage(count: number, total: number): number {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

/**
 * Determine if label should be shown based on percentage threshold
 */
export function shouldShowLabel(percentage: number, threshold: number): boolean {
  return percentage >= threshold
}

/**
 * Get segment configuration for a status
 */
export function getSegmentConfig(status: BatchStatKey) {
  return BATCH_STATS_CONFIG[status]
}

/**
 * Build all segment data from batch report (workflow + trashed)
 */
export function buildAllSegments(report: BatchReport): ProgressSegmentData[] {
  const total = report.total_tasks
  const segments: ProgressSegmentData[] = []

  // Build workflow segments
  for (const status of WORKFLOW_STATS) {
    const config = BATCH_STATS_CONFIG[status]
    const count = report[status]
    const percentage = calculatePercentage(count, total)

    segments.push({
      status,
      count,
      percentage,
      barColor: config.barColor,
      textColor: config.textColor,
      label: config.label,
    })
  }

  // Add trashed segment
  const config = BATCH_STATS_CONFIG.trashed
  const percentage = calculatePercentage(report.trashed, total)

  segments.push({
    status: 'trashed',
    count: report.trashed,
    percentage,
    barColor: config.barColor,
    textColor: config.textColor,
    label: config.label,
    isHatched: true,
  })

  return segments
}

/**
 * Calculate accepted percentage
 */
export function getAcceptedPercentage(report: BatchReport): number {
  const activeTotal = report.total_tasks - report.trashed
  return calculatePercentage(report.accepted, activeTotal)
}

