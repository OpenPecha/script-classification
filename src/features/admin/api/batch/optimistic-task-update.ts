import type { QueryClient } from '@tanstack/react-query'
import { batchKeys } from './batch-keys'
import { type BatchOverviewResponse, type BatchReport, type BatchTask } from '@/types'

export type TaskAction = 'VERIFY' | 'REJECT' | 'UNVERIFY' | 'RESTORE'

/**
 * Applies an optimistic local cache update for a task action.
 * Returns a context snapshot that can be used to roll back on error.
 */
export async function applyOptimisticTaskUpdate(
  queryClient: QueryClient,
  taskId: string,
  batchId: string,
  action: TaskAction,
) {
  // Cancel any outgoing refetches so they don't overwrite our optimistic update
  await queryClient.cancelQueries({ queryKey: ['batches', 'tasks', batchId] })
  await queryClient.cancelQueries({ queryKey: batchKeys.report(batchId) })

  // Snapshot previous values for rollback
  const previousTasksQueries = queryClient.getQueriesData<BatchOverviewResponse>({
    queryKey: ['batches', 'tasks', batchId],
  })
  const previousReport = queryClient.getQueryData<BatchReport>(batchKeys.report(batchId))

  // --- Update all task list caches ---
  const queries = queryClient.getQueryCache().findAll({ queryKey: ['batches', 'tasks', batchId] })
  queries.forEach(({ queryKey }) => {
    queryClient.setQueryData<BatchOverviewResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData

      const stateFilter = queryKey[3] as string | undefined
      const isVerifiedFilter = queryKey[6] as boolean | undefined

      // Find the task
      const taskIndex = oldData.tasks.findIndex((t: BatchTask) => t.task_id === taskId)
      if (taskIndex === -1) return oldData

      const task = oldData.tasks[taskIndex]
      const oldState = task.state
      const wasVerified = task.is_verified

      // Compute the next task shape based on action
      const updatedTask = getUpdatedTask(task, action)

      // Map the updated task into the list
      let updatedTasks = oldData.tasks.map((t: BatchTask) =>
        t.task_id === taskId ? updatedTask : t
      )

      // Filter the task out of the current view if it no longer matches the active filters
      updatedTasks = applyFilterRemoval(updatedTasks, taskId, action, stateFilter, isVerifiedFilter)

      // Update local stats counters
      const updatedStats = applyStatsUpdate({ ...oldData.filter_stats }, action, oldState, wasVerified)

      return { ...oldData, tasks: updatedTasks, filter_stats: updatedStats }
    })
  })

  // --- Update report cache ---
  // First find the task's previous state from the snapshots (needed for report update)
  let prevState: string | undefined = undefined
  let prevWasVerified = false
  for (const [, data] of previousTasksQueries) {
    const task = (data as BatchOverviewResponse | undefined)?.tasks?.find(
      (t: BatchTask) => t.task_id === taskId
    )
    if (task) {
      prevState = task.state
      prevWasVerified = task.is_verified
      break
    }
  }

  queryClient.setQueriesData<BatchReport>({ queryKey: batchKeys.report(batchId) }, (oldData) => {
    if (!oldData) return oldData
    return applyReportUpdate({ ...oldData }, action, prevState, prevWasVerified)
  })

  return { previousTasksQueries, previousReport }
}

/** Rolls back a previously snapshotted optimistic update. */
export function rollbackOptimisticTaskUpdate(
  queryClient: QueryClient,
  batchId: string,
  context: {
    previousTasksQueries: [readonly unknown[], BatchOverviewResponse | undefined][]
    previousReport: BatchReport | undefined
  },
) {
  context.previousTasksQueries.forEach(([queryKey, value]) => {
    queryClient.setQueryData(queryKey, value)
  })
  if (context.previousReport) {
    queryClient.setQueryData(batchKeys.report(batchId), context.previousReport)
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getUpdatedTask(task: BatchTask, action: TaskAction): BatchTask {
  switch (action) {
    case 'VERIFY':
      return { ...task, state: 'accepted', is_verified: true }
    case 'REJECT':
      return { ...task, state: 'trashed', is_verified: false }
    case 'RESTORE':
      return { ...task, state: 'pending', is_verified: false }
    case 'UNVERIFY':
      return { ...task, is_verified: false }
  }
}

function applyFilterRemoval(
  tasks: BatchTask[],
  taskId: string,
  action: TaskAction,
  stateFilter: string | undefined,
  isVerifiedFilter: boolean | undefined,
): BatchTask[] {
  switch (action) {
    case 'VERIFY':
      if (stateFilter && stateFilter !== 'all' && stateFilter !== 'accepted') {
        tasks = tasks.filter((t) => t.task_id !== taskId)
      }
      if (isVerifiedFilter === false) {
        tasks = tasks.filter((t) => t.task_id !== taskId)
      }
      break
    case 'REJECT':
      if (stateFilter && stateFilter !== 'all' && stateFilter !== 'trashed') {
        tasks = tasks.filter((t) => t.task_id !== taskId)
      }
      break
    case 'RESTORE':
      if (stateFilter && stateFilter !== 'all' && stateFilter !== 'pending') {
        tasks = tasks.filter((t) => t.task_id !== taskId)
      }
      break
    case 'UNVERIFY':
      if (isVerifiedFilter === true) {
        tasks = tasks.filter((t) => t.task_id !== taskId)
      }
      break
  }
  return tasks
}

function applyStatsUpdate(
  stats: BatchOverviewResponse['filter_stats'],
  action: TaskAction,
  oldState: string,
  wasVerified: boolean,
): BatchOverviewResponse['filter_stats'] {
  switch (action) {
    case 'VERIFY':
      if (oldState !== 'accepted') {
        if (oldState in stats) {
          ;(stats as any)[oldState] = Math.max(0, ((stats as any)[oldState] || 0) - 1)
        }
        stats.accepted = (stats.accepted || 0) + 1
      }
      if (!wasVerified) {
        stats.verified = (stats.verified || 0) + 1
      }
      break
    case 'REJECT':
      if (oldState && oldState !== 'trashed') {
        if (oldState in stats) {
          ;(stats as any)[oldState] = Math.max(0, ((stats as any)[oldState] || 0) - 1)
        }
        stats.trashed = (stats.trashed || 0) + 1
      }
      if (wasVerified) {
        stats.verified = Math.max(0, (stats.verified || 0) - 1)
      }
      stats.total_rejection_count = (stats.total_rejection_count || 0) + 1
      break
    case 'RESTORE':
      if (oldState && oldState !== 'pending') {
        if (oldState in stats) {
          ;(stats as any)[oldState] = Math.max(0, ((stats as any)[oldState] || 0) - 1)
        }
        stats.pending = (stats.pending || 0) + 1
      }
      break
    case 'UNVERIFY':
      if (wasVerified) {
        stats.verified = Math.max(0, (stats.verified || 0) - 1)
      }
      break
  }
  return stats
}

function applyReportUpdate(
  report: BatchReport,
  action: TaskAction,
  oldState: string | undefined,
  wasVerified: boolean,
): BatchReport {
  switch (action) {
    case 'VERIFY':
      if (oldState && oldState !== 'accepted') {
        if (oldState in report) {
          ;(report as any)[oldState] = Math.max(0, ((report as any)[oldState] || 0) - 1)
        }
        report.accepted = (report.accepted || 0) + 1
      }
      if (!wasVerified) {
        report.verified = (report.verified || 0) + 1
      }
      break
    case 'REJECT':
      if (oldState && oldState !== 'trashed') {
        if (oldState in report) {
          ;(report as any)[oldState] = Math.max(0, ((report as any)[oldState] || 0) - 1)
        }
        report.trashed = (report.trashed || 0) + 1
      }
      if (wasVerified) {
        report.verified = Math.max(0, (report.verified || 0) - 1)
      }
      report.total_rejection_count = (report.total_rejection_count || 0) + 1
      break
    case 'RESTORE':
      if (oldState && oldState !== 'pending') {
        if (oldState in report) {
          ;(report as any)[oldState] = Math.max(0, ((report as any)[oldState] || 0) - 1)
        }
        report.pending = (report.pending || 0) + 1
      }
      break
    case 'UNVERIFY':
      if (wasVerified) {
        report.verified = Math.max(0, (report.verified || 0) - 1)
      }
      break
  }
  return report
}
