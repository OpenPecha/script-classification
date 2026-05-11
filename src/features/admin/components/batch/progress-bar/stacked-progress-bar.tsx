import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BatchReport } from '@/types'
import { cn } from '@/lib/utils'
import { ProgressSegment } from './progress-segment'
import { DEFAULT_PROGRESS_BAR_CONFIG } from './progress-bar.types'
import { buildAllSegments, shouldShowLabel } from './progress-bar.utils'

interface StackedProgressBarProps {
  report: BatchReport
  className?: string
}

export function StackedProgressBar({ report, className }: StackedProgressBarProps) {
  const { t } = useTranslation('admin')
  const [isAnimated, setIsAnimated] = useState(false)

  // Trigger animation after mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsAnimated(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  const segments = buildAllSegments(report)

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-8 bg-slate-100 rounded-lg text-sm text-muted-foreground">
        {t('batches.noTasksInBatch')}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((segment) => (
          <div key={segment.status} className="flex items-center gap-1.5">
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-sm',
                segment.barColor,
                segment.isHatched && 'progress-segment-hatched'
              )}
            />
            <span>
              {segment.label} ({segment.count})
            </span>
          </div>
        ))}
      </div>
      <div
        className={cn(
          'flex h-8 w-full overflow-hidden rounded-lg gap-0.5',
          DEFAULT_PROGRESS_BAR_CONFIG.barHeight
        )}
        role="group"
        aria-label="Batch progress"
      >
        {segments
          .filter((s) => s.percentage > 0)
          .map((segment) => (
            <ProgressSegment
              key={segment.status}
              segment={segment}
              showLabel={shouldShowLabel(
                segment.percentage,
                DEFAULT_PROGRESS_BAR_CONFIG.labelThreshold
              )}
              isAnimated={isAnimated}
            />
          ))}
      </div>
    </div>
  )
}

