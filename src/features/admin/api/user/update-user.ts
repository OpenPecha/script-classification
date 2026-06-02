import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { type User, type UpdateUserDTO, type UserListResponse } from '@/types'
import { userKeys } from './user-keys'
import { groupKeys } from '../group/group-keys'

interface UpdateUserParams {
  id: string
  data: UpdateUserDTO
}

const updateUser = async ({ id, data }: UpdateUserParams): Promise<User> => {
  return apiClient.put(`/user/${id}`, data)
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      // Update only the affected user record in local queries
      queryClient.setQueriesData<InfiniteData<UserListResponse>>(
        { queryKey: userKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((user) =>
                user.id === updatedUser.id ? { ...user, ...updatedUser } : user
              ),
            })),
          }
        }
      )
      
      // Also invalidate group queries to refresh user lists in groups
      queryClient.invalidateQueries({ queryKey: groupKeys.all, refetchType: 'all' })
    },
  })
}

