import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import { applyOptimisticTaskUpdate, rollbackOptimisticTaskUpdate } from './optimistic-task-update'

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
    onMutate: async ({ taskId, batchId }) =>
      applyOptimisticTaskUpdate(queryClient, taskId, batchId, 'VERIFY'),
    onError: (_, { batchId }, context) => {
      if (context) rollbackOptimisticTaskUpdate(queryClient, batchId, context)
    },
  })
}
