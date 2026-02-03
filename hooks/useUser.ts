import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDb } from '@/contexts/DatabaseContext'
import { getUserRepository } from '@/services/repositories'
import { getDeviceId, clearAll } from '@/services/storage'
import { useSyncService } from './useSyncService'
import type { UserProfile } from '@/services/database/types'

export function useUser() {
  const db = useDb()
  const userRepo = getUserRepository(db)

  return useQuery({
    queryKey: ['user'],
    queryFn: () => userRepo.get(),
  })
}

export function useRegisterDevice() {
  const db = useDb()
  const userRepo = getUserRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush, pull } = useSyncService()

  return useMutation({
    mutationFn: async () => {
      const deviceId = await getDeviceId()

      // Check if user already exists locally
      let user = await userRepo.getByDeviceId(deviceId)
      const isNew = !user

      if (!user) {
        // Create new local user
        user = await userRepo.upsert({
          deviceId,
          name: 'User',
        })
      }

      return { user, isNew }
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['user'], data.user)

      // If new user or existing user, try to sync with server
      // This will pull any existing data from server for this device
      try {
        await pull()
      } catch {
        // Ignore sync errors - offline is fine
      }

      if (!data.isNew) {
        schedulePush()
      }
    },
  })
}

export function useUpdateUser() {
  const db = useDb()
  const userRepo = getUserRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      userRepo.update({
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        settings: data.settings,
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
      schedulePush()
    },
  })
}

export function useDeleteAccount() {
  const db = useDb()
  const userRepo = getUserRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: async () => {
      await userRepo.delete()
      await clearAll()
    },
    onSuccess: () => {
      queryClient.clear()
      schedulePush()
    },
  })
}
