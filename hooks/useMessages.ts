import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useDb } from '@/contexts/DatabaseContext'
import { getMessageRepository, getChatRepository } from '@/services/repositories'
import { useSyncService } from './useSyncService'
import type { MessageWithDetails, PaginatedResult, MessageType } from '@/services/database/types'

export function useMessages(chatId: string, params?: { limit?: number }) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const limit = params?.limit ?? 50

  return useInfiniteQuery({
    queryKey: ['messages', chatId, params],
    queryFn: async ({ pageParam }) => {
      const result = await messageRepo.getByChat(chatId, {
        before: pageParam,
        limit,
      })
      return {
        messages: result.data,
        hasMore: result.hasMore,
        total: result.total,
      }
    },
    getNextPageParam: (lastPage: { messages: MessageWithDetails[]; hasMore: boolean }) => {
      if (!lastPage.hasMore || lastPage.messages.length === 0) return undefined
      const oldestMessage = lastPage.messages[lastPage.messages.length - 1]
      return oldestMessage?.createdAt
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!chatId,
  })
}

export function useSendMessage(chatId: string) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const chatRepo = getChatRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: async (data: { content?: string; type: MessageType }) => {
      const message = await messageRepo.create({
        chatId,
        content: data.content,
        type: data.type,
      })

      // Update chat's last message
      await chatRepo.updateLastMessage(
        chatId,
        data.content ?? null,
        data.type,
        message.createdAt
      )

      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      schedulePush()
    },
  })
}

export function useUpdateMessage(chatId: string) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messageRepo.update(messageId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      schedulePush()
    },
  })
}

export function useDeleteMessage(chatId: string) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: (messageId: string) => messageRepo.delete(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      schedulePush()
    },
  })
}

export function useLockMessage(chatId: string) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: ({ messageId, isLocked }: { messageId: string; isLocked: boolean }) =>
      messageRepo.setLocked(messageId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      schedulePush()
    },
  })
}

export function useStarMessage(chatId: string) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: ({ messageId, isStarred }: { messageId: string; isStarred: boolean }) =>
      messageRepo.setStarred(messageId, isStarred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      schedulePush()
    },
  })
}

export function useSetMessageTask(chatId: string) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: ({
      messageId,
      isTask,
      reminderAt,
      isCompleted,
    }: {
      messageId: string
      isTask: boolean
      reminderAt?: string
      isCompleted?: boolean
    }) => messageRepo.setTask(messageId, { isTask, reminderAt, isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      schedulePush()
    },
  })
}

export function useCompleteTask(chatId: string) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()

  return useMutation({
    mutationFn: (messageId: string) => messageRepo.completeTask(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      schedulePush()
    },
  })
}
