import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import {
  getChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
  ChatsResponse,
} from '../services/api'
import type { Chat } from '../types'

export function useChats(params?: {
  search?: string
  filter?: 'all' | 'tasks' | 'pinned'
}) {
  return useQuery({
    queryKey: ['chats', params],
    queryFn: () => getChats(params),
  })
}

export function useInfiniteChats(params?: {
  search?: string
  filter?: 'all' | 'tasks' | 'pinned'
  limit?: number
}) {
  return useInfiniteQuery({
    queryKey: ['chats', 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      getChats({ ...params, page: pageParam, limit: params?.limit || 20 }),
    getNextPageParam: (lastPage: ChatsResponse) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })
}

export function useChat(id: string) {
  return useQuery({
    queryKey: ['chat', id],
    queryFn: () => getChat(id),
    enabled: !!id,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; icon?: string }) => createChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useUpdateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<Pick<Chat, 'name' | 'icon' | 'isPinned' | 'wallpaper'>>
    }) => updateChat(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.invalidateQueries({ queryKey: ['chat', id] })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteChat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}
