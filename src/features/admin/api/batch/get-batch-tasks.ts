import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { type BatchTaskState } from '@/types'
import { batchKeys } from './batch-keys'

interface GetBatchTasksParams {
  batchId: string
  state?: BatchTaskState | 'all'
  userId?: string
  role?: 'annotator' | 'reviewer'
  isVerified?: boolean
}

const getBatchTasks = async ({ 
  batchId, 
  state, 
  userId, 
  role,
  isVerified
}: GetBatchTasksParams): Promise<import('@/types').BatchOverviewResponse> => {
  const params: any = {}
  if (state && state !== 'all') params.state = state
  if (userId) params.user_id = userId
  if (role) params.role = role
  if (isVerified !== undefined) params.is_verified = isVerified
  
  return apiClient.get(`/batch/${batchId}/tasks/overview`, { params })
}

export const useGetBatchTasks = (
  batchId: string, 
  state?: BatchTaskState | 'all',
  userId?: string,
  role?: 'annotator' | 'reviewer',
  isVerified?: boolean
) => {
  return useQuery({
    queryKey: [...batchKeys.tasks(batchId, state), userId, role, isVerified],
    queryFn: () => getBatchTasks({ batchId, state, userId, role, isVerified }),
    enabled: !!batchId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

