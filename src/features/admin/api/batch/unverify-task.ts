import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { APPLICATION_NAME } from '@/lib/constant'
import { applyOptimisticTaskUpdate, rollbackOptimisticTaskUpdate } from './optimistic-task-update'

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
    onMutate: async ({ taskId, batchId }) =>
      applyOptimisticTaskUpdate(queryClient, taskId, batchId, 'UNVERIFY'),
    onError: (_, { batchId }, context) => {
      if (context) rollbackOptimisticTaskUpdate(queryClient, batchId, context)
    },
  })
}
