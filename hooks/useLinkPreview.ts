import { useQuery } from '@tanstack/react-query'
import { fetchLinkPreview, type LinkPreviewData, type LinkPreviewMode } from '@/services/linkPreview'

export function useLinkPreview(url: string | null, mode: LinkPreviewMode = 'text+image') {
  return useQuery<LinkPreviewData>({
    queryKey: ['link-preview', url],
    queryFn: () => fetchLinkPreview(url!, mode),
    enabled: !!url && mode !== 'off',
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  })
}
