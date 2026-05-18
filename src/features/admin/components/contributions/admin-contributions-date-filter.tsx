import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AdminContributionsDateFilterProps {
  /** Unique prefix for input ids when multiple filters exist on one page */
  inputIdPrefix: string
  draftStart: string
  draftEnd: string
  onDraftStartChange: (value: string) => void
  onDraftEndChange: (value: string) => void
  onApply: () => void
  onClear: () => void
  validationError: string | null
}

export function AdminContributionsDateFilter({
  inputIdPrefix,
  draftStart,
  draftEnd,
  onDraftStartChange,
  onDraftEndChange,
  onApply,
  onClear,
  validationError,
}: AdminContributionsDateFilterProps) {
  const { t } = useTranslation('admin')
  const startId = `${inputIdPrefix}-start`
  const endId = `${inputIdPrefix}-end`

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">{t('userContributions.dateFilterTitleGroup')}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={startId}>{t('userContributions.startDateInclusive')}</Label>
          <Input
            id={startId}
            type="date"
            value={draftStart}
            onChange={(e) => onDraftStartChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={endId}>{t('userContributions.endDateInclusive')}</Label>
          <Input
            id={endId}
            type="date"
            value={draftEnd}
            onChange={(e) => onDraftEndChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={onApply}>
            {t('userContributions.apply')}
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            {t('userContributions.clear')}
          </Button>
        </div>
      </div>
      {validationError ? (
        <p className="text-sm text-destructive">{validationError}</p>
      ) : null}
    </div>
  )
}
