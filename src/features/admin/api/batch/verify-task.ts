import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { batchKeys } from './batch-keys'
import { APPLICATION_NAME } from '@/lib/constant'
import { type BatchOverviewResponse, type BatchReport, type BatchTask } from '@/types'

interface VerifyTaskParams {
  taskId: string
  batchId: string
  userId: string
}

const verifyTask = async ({ taskId, userId }: VerifyTaskParams): Promise<void> => {
  return apiClient.post(`/tasks/${APPLICATION_NAME}/submit/${taskId}`, {
    user_id: userId,
    action: 'VERIFY',
  })
}

export const useVerifyTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyTask,
    onMutate: async ({ taskId, batchId }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['batches', 'tasks', batchId] })
      await queryClient.cancelQueries({ queryKey: batchKeys.report(batchId) })

      // Snapshot the previous values
      const previousTasksQueries = queryClient.getQueriesData<BatchOverviewResponse>({
        queryKey: ['batches', 'tasks', batchId]
      })
      const previousReport = queryClient.getQueryData<BatchReport>(batchKeys.report(batchId))

      // Optimistically update the tasks queries
      const queries = queryClient.getQueryCache().findAll({ queryKey: ['batches', 'tasks', batchId] })
      queries.forEach(({ queryKey }) => {
        queryClient.setQueryData<BatchOverviewResponse>(
          queryKey,
          (oldData) => {
            if (!oldData) return oldData

            const stateFilter = queryKey[3] as string | undefined
            const isVerifiedFilter = queryKey[6] as boolean | undefined

            // Find the task
            const taskIndex = oldData.tasks.findIndex((t: BatchTask) => t.task_id === taskId)
            if (taskIndex === -1) return oldData

            const task = oldData.tasks[taskIndex]
            const oldState = task.state
            const wasVerified = task.is_verified

            // Create updated task
            const updatedTask = {
              ...task,
              state: 'accepted' as const,
              is_verified: true,
            }

            // Update tasks list
            let updatedTasks = oldData.tasks.map((t: BatchTask) => t.task_id === taskId ? updatedTask : t)

            // If the task no longer matches the filter, filter it out from the current view
            if (stateFilter && stateFilter !== 'all' && stateFilter !== 'accepted') {
              updatedTasks = updatedTasks.filter((t: BatchTask) => t.task_id !== taskId)
            }
            if (isVerifiedFilter === false) {
              updatedTasks = updatedTasks.filter((t: BatchTask) => t.task_id !== taskId)
            }

            // Update local counters
            const updatedStats = { ...oldData.filter_stats }
            if (oldState !== 'accepted') {
              // Decrement old state
              if (oldState && oldState in updatedStats) {
                (updatedStats as any)[oldState] = Math.max(0, ((updatedStats as any)[oldState] || 0) - 1)
              }
              // Increment accepted
              updatedStats.accepted = (updatedStats.accepted || 0) + 1
            }
            if (!wasVerified) {
              // Increment verified
              updatedStats.verified = (updatedStats.verified || 0) + 1
            }

            return {
              ...oldData,
              tasks: updatedTasks,
              filter_stats: updatedStats,
            }
          }
        )
      })

      // Optimistically update the report queries
      queryClient.setQueriesData<BatchReport>(
        { queryKey: batchKeys.report(batchId) },
        (oldData) => {
          if (!oldData) return oldData

          // Find the task's old state from the previous tasks queries snapshots
          let oldState: string | undefined = undefined
          let wasVerified = false

          for (const [_, data] of previousTasksQueries) {
            const overview = data as BatchOverviewResponse | undefined
            const task = overview?.tasks?.find((t: BatchTask) => t.task_id === taskId)
            if (task) {
              oldState = task.state
              wasVerified = task.is_verified
              break
            }
          }

          const updatedReport = { ...oldData }
          if (oldState && oldState !== 'accepted') {
            if (oldState in updatedReport) {
              (updatedReport as any)[oldState] = Math.max(0, ((updatedReport as any)[oldState] || 0) - 1)
            }
            updatedReport.accepted = (updatedReport.accepted || 0) + 1
          }
          if (!wasVerified) {
            updatedReport.verified = (updatedReport.verified || 0) + 1
          }

          return updatedReport
        }
      )

      // Return a context object with the snapshotted values
      return { previousTasksQueries, previousReport }
    },
    onError: (_, { batchId }, context) => {
      // Roll back
      if (context?.previousTasksQueries) {
        context.previousTasksQueries.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value)
        })
      }
      if (context?.previousReport) {
        queryClient.setQueryData(batchKeys.report(batchId), context.previousReport)
      }
    },
  })
}
