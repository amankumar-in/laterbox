import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { registerDevice, getCurrentUser, updateUser, deleteAccount } from '../services/api'
import { clearAll } from '../services/storage'
import type { User } from '../types'

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
  })
}

export function useRegisterDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerDevice,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<User>) => updateUser(data),
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await clearAll()
      queryClient.clear()
    },
  })
}
