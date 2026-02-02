import { useQuery } from '@tanstack/react-query'
import { getTasks, getUpcomingTasks } from '../services/api'

export function useTasks(params?: {
  filter?: 'pending' | 'completed' | 'overdue'
  chatId?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => getTasks(params),
  })
}

export function useUpcomingTasks(days?: number) {
  return useQuery({
    queryKey: ['tasks', 'upcoming', days],
    queryFn: () => getUpcomingTasks(days),
  })
}
