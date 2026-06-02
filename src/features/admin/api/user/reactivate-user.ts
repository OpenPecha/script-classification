import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { apiClient } from '@/lib/axios'
import { type CreateUserDTO, type User, type UserListResponse } from '@/types'
import { userKeys } from './user-keys'

const reactivateUser = async (data: CreateUserDTO): Promise<User> => {
  return apiClient.post('/user/', data)
}

export const useReactivateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateUser,
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
                user.email === updatedUser.email
                  ? { ...user, ...updatedUser, active: true }
                  : user
              ),
            })),
          }
        }
      )
    },
  })
}
