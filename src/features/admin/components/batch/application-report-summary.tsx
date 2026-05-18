import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetApplicationReport } from '../../api/batch'

interface SummaryCardProps {
  label: string
  value: number
  percentage: number
}

function SummaryCard({ label, value, percentage }: SummaryCardProps) {
  return (
    <Card className="rounded-lg border bg-card/60 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{percentage}%</p>
      </div>
    </Card>
  )
}

function SummaryCardsSkeleton() {
  return (
    <div className="space-y-3 pb-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="rounded-lg border px-4 py-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-7 w-24" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}

const SCRIPT_GROUPS: Record<string, string[]> = {
  Uchen: ['uchen', 'uchen_sugthung', 'uchen_sugdring', 'uchen_sugring'],
  Druma: ['druma', 'dhumri', 'druthung', 'drudring', 'druring', 'druchen'],
  Danyig: ['danyig', 'tsegdrig', 'drathung', 'dradring', 'draring', 'gongshabma'],
  Pedri: ['pedri', 'peri', 'petsuk'],
  Tsugdri: ['tsugdri', 'tsugthung', 'tsugchung', 'trinyig'],
  Gyuyig: ['gyuyig', 'yigchung', 'tsumachug', 'khyuyig'],
  'Multi-Scripts': ['multi_scripts'],
  Other: ['other', 'non_tibetan', 'difficult'],
}

function GroupedScriptTypeBreakdown({
  scriptTypes,
  totalAccepted,
}: {
  scriptTypes: Record<string, number> | undefined
  totalAccepted: number
}) {
  const { t } = useTranslation('admin')

  const groups: Record<string, number> = {
    'Uchen': 0,
    'Druma': 0,
    'Danyig': 0,
    'Pedri': 0,
    'Tsugdri': 0,
    'Gyuyig': 0,
    'Multi-Scripts': 0,
    'Other': 0,
  }

  const reverseMap: Record<string, string> = {}
  for (const [groupName, keys] of Object.entries(SCRIPT_GROUPS)) {
    for (const k of keys) {
      const normK = k.toLowerCase().replace(/[- ]/g, '_')
      reverseMap[normK] = groupName
    }
  }

  for (const [key, count] of Object.entries(scriptTypes ?? {})) {
    if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) continue
    const normKey = key.toLowerCase().replace(/[- ]/g, '_')
    const targetGroup = reverseMap[normKey] ?? 'Other'
    groups[targetGroup] += count
  }

  const groupedCounts = Object.keys(groups)
    .map((group) => ({
      group,
      count: groups[group],
    }))
    .sort((a, b) => b.count - a.count)

  const maxCount = groupedCounts[0]?.count ?? 0

  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <div className="text-xs font-medium text-muted-foreground">
        {t('batches.scriptTypeBreakdown', { count: totalAccepted })}
      </div>

      <div className="mt-3 space-y-2">
        {groupedCounts.map(({ group, count }) => {
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

          return (
            <div key={group} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 truncate text-muted-foreground font-medium" title={group}>
                {group}
              </span>
              <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-emerald-500/70 rounded-sm transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums font-medium text-foreground">
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ApplicationReportSummary() {
  const { t } = useTranslation('admin')
  const { data: report, isLoading } = useGetApplicationReport()

  if (isLoading) return <SummaryCardsSkeleton />
  if (!report) return null

  const total = report.total_tasks
  const percentOfTotal = (count: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  const cards = [
    { label: t('batches.total'), value: report.total_tasks, percentage: 100 },
    { label: t('batches.states.pending'), value: report.pending, percentage: percentOfTotal(report.pending) },
    {
      label: t('batches.states.half_annotated'),
      value: report.half_annotated,
      percentage: percentOfTotal(report.half_annotated),
    },
    {
      label: t('batches.states.annotated'),
      value: report.annotated,
      percentage: percentOfTotal(report.annotated),
    },
    { label: t('batches.states.accepted'), value: report.accepted, percentage: percentOfTotal(report.accepted) },
    { label: t('batches.states.trashed'), value: report.trashed, percentage: percentOfTotal(report.trashed) },
  ]

  return (
    <div className="space-y-3 pb-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t('batches.allBatchesSummary')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {cards.map((card) => (
            <SummaryCard
              key={card.label}
              label={card.label}
              value={card.value}
              percentage={card.percentage}
            />
          ))}
        </div>
      </div>

      <GroupedScriptTypeBreakdown
        scriptTypes={report.script_types}
        totalAccepted={report.accepted}
      />
    </div>
  )
}
