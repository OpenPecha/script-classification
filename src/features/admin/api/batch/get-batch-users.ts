import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { type BatchUser } from '@/types'
import { batchKeys } from './batch-keys'

const getBatchUsers = async (batchId: string): Promise<BatchUser[]> => {
  return apiClient.get(`/batch/${batchId}/group-users`)
}

export const useGetBatchUsers = (batchId: string) => {
  return useQuery({
    queryKey: [...batchKeys.all, 'users', batchId],
    queryFn: () => getBatchUsers(batchId),
    enabled: !!batchId,
    staleTime: 1000 * 60 * 10, // 10 minutes, user list doesn't change often
  })
}
