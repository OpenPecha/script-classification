import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { batchKeys } from './batch-keys'
import { APPLICATION_NAME } from '@/lib/constant'
import { type BatchOverviewResponse, type BatchReport, type BatchTask } from '@/types'

interface RejectTaskParams {
  taskId: string
  batchId: string
  userId: string
}

const rejectTask = async ({ taskId, userId }: RejectTaskParams): Promise<void> => {
  return apiClient.post(`/tasks/${APPLICATION_NAME}/submit/${taskId}`, {
    user_id: userId,
    action: 'REJECT',
  })
}

export const useRejectTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rejectTask,
    onMutate: async ({ taskId, batchId }) => {
      await queryClient.cancelQueries({ queryKey: ['batches', 'tasks', batchId] })
      await queryClient.cancelQueries({ queryKey: batchKeys.report(batchId) })

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

            // Find the task
            const taskIndex = oldData.tasks.findIndex((t: BatchTask) => t.task_id === taskId)
            if (taskIndex === -1) return oldData

            const task = oldData.tasks[taskIndex]
            const oldState = task.state
            const wasVerified = task.is_verified

            // Create updated task
            const updatedTask = {
              ...task,
              state: 'trashed' as const,
              is_verified: false,
            }

            // Update tasks list
            let updatedTasks = oldData.tasks.map((t: BatchTask) => t.task_id === taskId ? updatedTask : t)

            // If filtering state is not 'all' and not 'trashed', filter it out
            if (stateFilter && stateFilter !== 'all' && stateFilter !== 'trashed') {
              updatedTasks = updatedTasks.filter((t: BatchTask) => t.task_id !== taskId)
            }

            // Update local counters
            const updatedStats = { ...oldData.filter_stats }
            if (oldState && oldState !== 'trashed') {
              if (oldState in updatedStats) {
                (updatedStats as any)[oldState] = Math.max(0, ((updatedStats as any)[oldState] || 0) - 1)
              }
              updatedStats.trashed = (updatedStats.trashed || 0) + 1
            }
            if (wasVerified) {
              updatedStats.verified = Math.max(0, (updatedStats.verified || 0) - 1)
            }
            updatedStats.total_rejection_count = (updatedStats.total_rejection_count || 0) + 1

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
          if (oldState && oldState !== 'trashed') {
            if (oldState in updatedReport) {
              (updatedReport as any)[oldState] = Math.max(0, ((updatedReport as any)[oldState] || 0) - 1)
            }
            updatedReport.trashed = (updatedReport.trashed || 0) + 1
          }
          if (wasVerified) {
            updatedReport.verified = Math.max(0, (updatedReport.verified || 0) - 1)
          }
          updatedReport.total_rejection_count = (updatedReport.total_rejection_count || 0) + 1

          return updatedReport
        }
      )

      return { previousTasksQueries, previousReport }
    },
    onError: (_, { batchId }, context) => {
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
