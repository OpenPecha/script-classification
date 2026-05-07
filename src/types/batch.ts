// Batch from list endpoint
export interface Batch {
  id: string
  name: string
  created: string
  group_id: string
  group_name: string
}

export interface BatchUser {
  id: string
  username: string
  email: string
  role: 'annotator' | 'reviewer'
  group_id: string | null
  group_name: string | null
}

// Script type count in accepted tasks
export interface AcceptedScriptTypeCount {
  script_type: string
  count: number
}

// Individual task from batch export endpoint
export type BatchExportTask = {
  file_number: string
  image_url: string
  orientation: 'landscape' | 'portrait' | null
  status: BatchTaskState
  annotator_a_username: string | null
  classification_a: string | null
  annotator_b_username: string | null
  classification_b: string | null
  reviewer_username: string | null
  final_script: string | null
  trashed_by: string | null
}

// Response from batch export endpoint
export type BatchExportResponse = {
  batch_name: string
  tasks: BatchExportTask[]
}

// Task state for batch task view
export type BatchTaskState = 'pending' | 'half_annotated' | 'annotated' | 'accepted' | 'trashed'

// Individual task from batch tasks endpoint
export interface BatchTask {
  task_id: string
  task_name: string
  task_url: string
  orientation: 'landscape' | 'portrait'
  state: BatchTaskState
  annotator_a_username: string | null
  classification_a: string | null
  annotator_b_username: string | null
  classification_b: string | null
  reviewer_username: string | null
  final_script: string | null
  trashed_by: string | null
  is_previously_rejected: boolean
  is_verified: boolean
}

// Batch with stats from report endpoint
export interface BatchReport extends Batch {
  total_tasks: number
  pending: number
  half_annotated: number
  annotated: number
  accepted: number
  verified: number
  trashed: number
  total_rejection_count: number
  script_types?: Record<string, number>
}

export interface BatchOverviewResponse {
  tasks: BatchTask[]
  filter_stats: BatchReport
}

export interface ApplicationBatchReport {
  id: string
  name: string
  created: string
  group_id: string
  total_tasks: number
  pending: number
  half_annotated: number
  annotated: number
  accepted: number
  trashed: number
  script_types?: Record<string, number>
}

// Individual task in upload JSON
export interface BatchUploadTask {
  name: string
  url: string
  transcript?: string | null
  orientation?: 'landscape' | 'portrait' | null
}

// Request payload for batch upload
export interface BatchUploadRequest {
  batch_name: string
  group_id: string
  tasks: BatchUploadTask[]
}

// Stats configuration for display
export const BATCH_STATS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-slate-100 text-slate-700',
    barColor: 'bg-slate-200',
    textColor: 'text-slate-700',
    order: 0,
  },
  half_annotated: {
    label: 'Half Annotated',
    color: 'bg-amber-100 text-amber-700',
    barColor: 'bg-amber-400',
    textColor: 'text-white',
    order: 1,
  },
  annotated: {
    label: 'Annotated',
    color: 'bg-blue-100 text-blue-700',
    barColor: 'bg-indigo-500',
    textColor: 'text-white',
    order: 2,
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-emerald-100 text-emerald-700',
    barColor: 'bg-emerald-500',
    textColor: 'text-white',
    order: 3,
  },
  trashed: {
    label: 'Trashed',
    color: 'bg-red-100 text-red-700',
    barColor: 'bg-rose-500',
    textColor: 'text-white',
    order: 4,
    isHatched: true,
  },
} as const

export type BatchStatKey = keyof typeof BATCH_STATS_CONFIG

// Workflow statuses (excluding trashed)
export const WORKFLOW_STATS: BatchStatKey[] = ['pending', 'half_annotated', 'annotated', 'accepted']

