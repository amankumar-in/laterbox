import { useQuery } from '@tanstack/react-query'
import { search, searchInChat } from '../services/api'

export function useSearch(
  query: string,
  params?: {
    type?: 'all' | 'chats' | 'messages'
    page?: number
    limit?: number
  }
) {
  return useQuery({
    queryKey: ['search', query, params],
    queryFn: () => search({ q: query, ...params }),
    enabled: query.length >= 2,
  })
}

export function useSearchInChat(
  chatId: string,
  query: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['search', 'chat', chatId, query, params],
    queryFn: () => searchInChat(chatId, { q: query, ...params }),
    enabled: query.length >= 2 && !!chatId,
  })
}
