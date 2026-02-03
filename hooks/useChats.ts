import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useDb } from '@/contexts/DatabaseContext'
import { getChatRepository } from '@/services/repositories'
import { useSyncService } from './useSyncService'
import type { ChatWithLastMessage, PaginatedResult } from '@/services/database/types'

export function useChats(params?: {
  search?: string
  filter?: 'all' | 'tasks' | 'pinned'
}) {
  const db = useDb()
  const chatRepo = getChatRepository(db)

  return useQuery({
    queryKey: ['chats', params],
    queryFn: async (): Promise<PaginatedResult<ChatWithLastMessage>> => {
      return chatRepo.getAll({ search: params?.search })
    },
  })
}

export function useInfiniteChats(params?: {
  search?: string
  filter?: 'all' | 'tasks' | 'pinned'
  limit?: number
}) {
  const db = useDb()
  const chatRepo = getChatRepository(db)
  const limit = params?.limit ?? 20

  return useInfiniteQuery({
    queryKey: ['chats', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await chatRepo.getAll({
        search: params?.search,
        page: pageParam,
        limit,
      })
      return { ...result, page: pageParam }
    },
    getNextPageParam: (lastPage: PaginatedResult<ChatWithLastMessage> & { page: number }) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })
}

export function useChat(id: string) {
  const db = useDb()
  const chatRepo = getChatRepository(db)

  return useQuery({
    queryKey: ['chat', id],
    queryFn: () => chatRepo.getById(id),
    enabled: !!id,
  })
}

export function useCreateChat() {
  const db = useDb()
  const chatRepo = getChatRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: (data: { name: string; icon?: string }) => chatRepo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      schedulePush()
    },
  })
}

export function useUpdateChat() {
  const db = useDb()
  const chatRepo = getChatRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{ name: string; icon: string | null; isPinned: boolean; wallpaper: string | null }>
    }) => chatRepo.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.invalidateQueries({ queryKey: ['chat', id] })
      schedulePush()
    },
  })
}

export function useDeleteChat() {
  const db = useDb()
  const chatRepo = getChatRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: (id: string) => chatRepo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      schedulePush()
    },
  })
}
