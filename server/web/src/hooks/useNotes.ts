import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { PaginatedResult, NoteWithDetails, CreateNoteInput } from '../api/types'

export function useNotes(threadId: string | null) {
  return useInfiniteQuery<PaginatedResult<NoteWithDetails>>({
    queryKey: ['notes', threadId],
    queryFn: ({ pageParam }) =>
      apiClient
        .get(`/api/threads/${threadId}/notes`, {
          params: pageParam ? { cursor: pageParam } : undefined,
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!threadId,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateNoteInput) =>
      apiClient.post(`/api/threads/${data.threadId}/notes`, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.threadId] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, threadId, ...data }: { id: string; threadId: string; content?: string; isStarred?: boolean; isPinned?: boolean; isLocked?: boolean }) =>
      apiClient.patch(`/api/notes/${id}`, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.threadId] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; threadId: string }) =>
      apiClient.delete(`/api/notes/${params.id}`).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.threadId] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      const res = await apiClient.post('/api/files/upload', {
        data: base64,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
      })
      return res.data.attachment
    },
  })
}
