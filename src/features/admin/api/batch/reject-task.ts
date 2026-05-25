import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import { applyOptimisticTaskUpdate, rollbackOptimisticTaskUpdate } from './optimistic-task-update'

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
    onMutate: async ({ taskId, batchId }) =>
      applyOptimisticTaskUpdate(queryClient, taskId, batchId, 'REJECT'),
    onError: (_, { batchId }, context) => {
      if (context) rollbackOptimisticTaskUpdate(queryClient, batchId, context)
    },
  })
}
