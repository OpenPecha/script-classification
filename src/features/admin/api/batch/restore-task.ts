import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import { applyOptimisticTaskUpdate, rollbackOptimisticTaskUpdate } from './optimistic-task-update'

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
    onMutate: async ({ taskId, batchId }) =>
      applyOptimisticTaskUpdate(queryClient, taskId, batchId, 'RESTORE'),
    onError: (_, { batchId }, context) => {
      if (context) rollbackOptimisticTaskUpdate(queryClient, batchId, context)
    },
  })
}
