import { useQuery } from '@tanstack/react-query'
import { useDb } from '@/contexts/DatabaseContext'
import { getMessageRepository, getChatRepository } from '@/services/repositories'

export function useSearch(
  query: string,
  params?: {
    type?: 'all' | 'chats' | 'messages'
    page?: number
    limit?: number
  }
) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)
  const chatRepo = getChatRepository(db)

  return useQuery({
    queryKey: ['search', query, params],
    queryFn: async () => {
      const type = params?.type ?? 'all'

      if (type === 'chats') {
        const chats = await chatRepo.getAll({ search: query, page: params?.page, limit: params?.limit })
        return {
          chats: chats.data,
          messages: [],
          total: chats.total,
        }
      }

      if (type === 'messages') {
        const messages = await messageRepo.search({ query, page: params?.page, limit: params?.limit })
        return {
          chats: [],
          messages: messages.data,
          total: messages.total,
        }
      }

      // 'all' - search both
      const [chats, messages] = await Promise.all([
        chatRepo.getAll({ search: query, page: params?.page, limit: params?.limit }),
        messageRepo.search({ query, page: params?.page, limit: params?.limit }),
      ])

      return {
        chats: chats.data,
        messages: messages.data,
        total: chats.total + messages.total,
      }
    },
    enabled: query.length >= 2,
  })
}

export function useSearchInChat(
  chatId: string,
  query: string,
  params?: { page?: number; limit?: number }
) {
  const db = useDb()
  const messageRepo = getMessageRepository(db)

  return useQuery({
    queryKey: ['search', 'chat', chatId, query, params],
    queryFn: async () => {
      const result = await messageRepo.searchInChat(chatId, query, params)
      return {
        messages: result.data,
        total: result.total,
      }
    },
    enabled: query.length >= 2 && !!chatId,
  })
}
