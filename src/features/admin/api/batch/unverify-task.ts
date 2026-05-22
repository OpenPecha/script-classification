import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { batchKeys } from './batch-keys'
import { APPLICATION_NAME } from '@/lib/constant'
import { type BatchOverviewResponse, type BatchReport, type BatchTask } from '@/types'

interface UnverifyTaskParams {
  taskId: string
  batchId: string
  userId: string
}

const unverifyTask = async ({ taskId, userId }: UnverifyTaskParams): Promise<void> => {
  return apiClient.post(`/tasks/${APPLICATION_NAME}/submit/${taskId}`, {
    user_id: userId,
    action: 'UNVERIFY',
  })
}

export const useUnverifyTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unverifyTask,
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

            const isVerifiedFilter = queryKey[6] as boolean | undefined

            // Find the task
            const taskIndex = oldData.tasks.findIndex((t: BatchTask) => t.task_id === taskId)
            if (taskIndex === -1) return oldData

            const task = oldData.tasks[taskIndex]
            const wasVerified = task.is_verified

            // Create updated task
            const updatedTask = {
              ...task,
              is_verified: false,
            }

            // Update tasks list
            let updatedTasks = oldData.tasks.map((t: BatchTask) => t.task_id === taskId ? updatedTask : t)

            // If filtering for verified only (isVerifiedFilter === true) and it is now unverified, filter it out
            if (isVerifiedFilter === true) {
              updatedTasks = updatedTasks.filter((t: BatchTask) => t.task_id !== taskId)
            }

            // Update local counters
            const updatedStats = { ...oldData.filter_stats }
            if (wasVerified) {
              updatedStats.verified = Math.max(0, (updatedStats.verified || 0) - 1)
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

          let wasVerified = false
          for (const [_, data] of previousTasksQueries) {
            const overview = data as BatchOverviewResponse | undefined
            const task = overview?.tasks?.find((t: BatchTask) => t.task_id === taskId)
            if (task) {
              wasVerified = task.is_verified
              break
            }
          }

          const updatedReport = { ...oldData }
          if (wasVerified) {
            updatedReport.verified = Math.max(0, (updatedReport.verified || 0) - 1)
          }

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
