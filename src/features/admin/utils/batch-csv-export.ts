import Papa from 'papaparse'

import type { BatchExportTask, ScriptStyle } from '@/types'
import { getDisplayName } from '@/types'

/**
 * CSV column headers mapping to BatchExportTask fields
 * Order determines column order in exported CSV
 */
const CSV_COLUMNS = [
  { key: 'file_number', header: 'file_number' },
  { key: 'image_url', header: 'image_url' },
  { key: 'status', header: 'status' },
  { key: 'annotator_a_username', header: 'annotator_a_username' },
  { key: 'classification_a', header: 'classification_a' },
  { key: 'annotator_b_username', header: 'annotator_b_username' },
  { key: 'classification_b', header: 'classification_b' },
  { key: 'reviewer_username', header: 'reviewer_username' },
  { key: 'final_script', header: 'final_script' },
  { key: 'is_verified', header: 'is_verified' },
  { key: 'rejection_count', header: 'rejection_count' },
  { key: 'trashed_by', header: 'trashed_by' },
] as const satisfies ReadonlyArray<{ key: keyof BatchExportTask; header: string }>

const CLASSIFICATION_FIELDS = new Set<string>(['classification_a', 'classification_b', 'final_script'])

/**
 * Transforms a BatchExportTask to a CSV row
 * Classification fields are resolved to display names via the styles lookup
 */
function transformTaskToCsvRow(
  task: BatchExportTask,
  styles: ScriptStyle[],
): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {}

  for (const { key, header } of CSV_COLUMNS) {
    const value = task[key]
    if (value != null && CLASSIFICATION_FIELDS.has(key)) {
      row[header] = getDisplayName(styles, String(value))
    } else {
      row[header] = value ?? ''
    }
  }

  return row
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'batch-export'
}

function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Exports batch tasks to CSV and triggers download
 *
 * @param tasks - Array of batch export tasks to export
 * @param batchName - Name of the batch (used for filename)
 * @param styles - Script styles for display name resolution
 */
export function exportBatchTasksToCsv(
  tasks: BatchExportTask[],
  batchName: string,
  styles: ScriptStyle[],
): void {
  if (tasks.length === 0) {
    return
  }

  const csvRows = tasks.map((task) => transformTaskToCsvRow(task, styles))
  const headers = CSV_COLUMNS.map(({ header }) => header)

  const csvContent = Papa.unparse(csvRows, {
    columns: headers,
    quotes: true,
    newline: '\n',
  })

  const filename = `${sanitizeFilename(batchName)}.csv`
  downloadFile(csvContent, filename)
}
