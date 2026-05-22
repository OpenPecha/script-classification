import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { batchKeys } from './batch-keys'
import { APPLICATION_NAME } from '@/lib/constant'
import { type BatchOverviewResponse, type BatchReport, type BatchTask } from '@/types'

interface RestoreTaskParams {
  taskId: string
  batchId: string
}

const restoreTask = async ({ taskId }: RestoreTaskParams): Promise<void> => {
  return apiClient.post(`/tasks/${APPLICATION_NAME}/${taskId}/restore`)
}

export const useRestoreTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreTask,
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

            // Create updated task
            const updatedTask = {
              ...task,
              state: 'pending' as const,
              is_verified: false,
            }

            // Update tasks list
            let updatedTasks = oldData.tasks.map((t: BatchTask) => t.task_id === taskId ? updatedTask : t)

            // If filtering state is not 'all' and not 'pending', filter it out
            if (stateFilter && stateFilter !== 'all' && stateFilter !== 'pending') {
              updatedTasks = updatedTasks.filter((t: BatchTask) => t.task_id !== taskId)
            }

            // Update local counters
            const updatedStats = { ...oldData.filter_stats }
            if (oldState && oldState !== 'pending') {
              if (oldState in updatedStats) {
                (updatedStats as any)[oldState] = Math.max(0, ((updatedStats as any)[oldState] || 0) - 1)
              }
              updatedStats.pending = (updatedStats.pending || 0) + 1
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

          let oldState: string | undefined = undefined
          for (const [_, data] of previousTasksQueries) {
            const overview = data as BatchOverviewResponse | undefined
            const task = overview?.tasks?.find((t: BatchTask) => t.task_id === taskId)
            if (task) {
              oldState = task.state
              break
            }
          }

          const updatedReport = { ...oldData }
          if (oldState && oldState !== 'pending') {
            if (oldState in updatedReport) {
              (updatedReport as any)[oldState] = Math.max(0, ((updatedReport as any)[oldState] || 0) - 1)
            }
            updatedReport.pending = (updatedReport.pending || 0) + 1
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

