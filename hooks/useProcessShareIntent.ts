import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDb } from '@/contexts/DatabaseContext'
import { getNoteRepository, getThreadRepository } from '@/services/repositories'
import { useSyncService } from './useSyncService'
import { processSharedFile, generateThumbnail } from '@/services/fileStorage'
import { fetchLinkPreview } from '@/services/linkPreview'
import { useLinkPreviewMode } from '@/contexts/LinkPreviewContext'
import type { ShareIntent } from 'expo-share-intent'
import type { NoteType, CreateNoteInput } from '@/services/database/types'

interface ProcessShareIntentParams {
  shareIntent: ShareIntent
  threadId: string
  caption?: string
}

export function useProcessShareIntent() {
  const db = useDb()
  const noteRepo = getNoteRepository(db)
  const threadRepo = getThreadRepository(db)
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()
  const { linkPreviewMode } = useLinkPreviewMode()

  return useMutation({
    mutationFn: async ({ shareIntent, threadId, caption }: ProcessShareIntentParams) => {
      const createdNoteIds: string[] = []

      // Handle by share type
      if (shareIntent.type === 'weburl' && shareIntent.webUrl) {
        // URL share
        const url = shareIntent.webUrl
        const content = caption || url

        let linkPreview: CreateNoteInput['linkPreview'] = null
        if (linkPreviewMode !== 'off') {
          try {
            const preview = await fetchLinkPreview(url, linkPreviewMode)
            linkPreview = {
              url: preview.url,
              title: preview.title ?? undefined,
              description: preview.description ?? undefined,
              image: preview.localImage ?? preview.imageUrl ?? undefined,
            }
          } catch {
            // Preview fetch failed — save note without preview
          }
        }

        const note = await noteRepo.create({
          threadId,
          content,
          type: 'text',
          linkPreview,
        })

        await updateThreadLastNote(threadRepo, threadId, content, 'text', note.createdAt)
        createdNoteIds.push(note.id)

      } else if (shareIntent.type === 'text' && shareIntent.text) {
        // Plain text share
        const text = caption ? `${shareIntent.text}\n\n${caption}` : shareIntent.text

        // Check if the text contains a URL
        const urlMatch = text.match(/https?:\/\/[^\s<>"\])}]+/i)
        let linkPreview: CreateNoteInput['linkPreview'] = null

        if (urlMatch && linkPreviewMode !== 'off') {
          try {
            const preview = await fetchLinkPreview(urlMatch[0], linkPreviewMode)
            linkPreview = {
              url: preview.url,
              title: preview.title ?? undefined,
              description: preview.description ?? undefined,
              image: preview.localImage ?? preview.imageUrl ?? undefined,
            }
          } catch {
            // Preview fetch failed
          }
        }

        const note = await noteRepo.create({
          threadId,
          content: text,
          type: 'text',
          linkPreview,
        })

        await updateThreadLastNote(threadRepo, threadId, text, 'text', note.createdAt)
        createdNoteIds.push(note.id)

      } else if (
        (shareIntent.type === 'media' || shareIntent.type === 'file') &&
        shareIntent.files?.length
      ) {
        // File/media shares — one note per file
        for (const file of shareIntent.files) {
          const mimeType = file.mimeType || 'application/octet-stream'

          try {
            const processed = await processSharedFile({
              path: file.path,
              fileName: file.fileName,
              mimeType,
              size: file.size,
            })

            const noteType = getNoteTypeFromMime(mimeType)
            let thumbnail: string | undefined

            // Generate thumbnail for videos
            if (noteType === 'video') {
              const thumb = await generateThumbnail(processed.localUri)
              if (thumb) thumbnail = thumb
            }

            const note = await noteRepo.create({
              threadId,
              content: caption || undefined,
              type: noteType,
              attachment: {
                url: processed.localUri,
                filename: processed.filename,
                mimeType,
                size: file.size ?? undefined,
                duration: file.duration ?? undefined,
                thumbnail,
                width: file.width ?? undefined,
                height: file.height ?? undefined,
              },
            })

            const lastNoteContent = caption || getLastNoteLabel(noteType, processed.filename)
            await updateThreadLastNote(threadRepo, threadId, lastNoteContent, noteType, note.createdAt)
            createdNoteIds.push(note.id)

            // Only use caption for first file
            caption = undefined
          } catch (error) {
            console.warn('[ShareIntent] Failed to process file:', file.fileName, error)
          }
        }
      }

      return createdNoteIds
    },
    onSuccess: (noteIds, { threadId }) => {
      if (noteIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['notes', threadId] })
        queryClient.invalidateQueries({ queryKey: ['thread-media', threadId] })
        queryClient.invalidateQueries({ queryKey: ['threads'] })
        schedulePush()
      }
    },
  })
}

function getNoteTypeFromMime(mimeType: string): NoteType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'text/vcard' || mimeType === 'text/x-vcard') return 'contact'
  return 'file'
}

function getLastNoteLabel(type: NoteType, filename?: string): string {
  switch (type) {
    case 'image': return 'Photo'
    case 'video': return 'Video'
    case 'audio': return filename || 'Audio'
    case 'contact': return filename || 'Contact'
    case 'file': return filename || 'File'
    default: return 'Note'
  }
}

async function updateThreadLastNote(
  threadRepo: ReturnType<typeof getThreadRepository>,
  threadId: string,
  content: string,
  type: NoteType,
  timestamp: string
) {
  await threadRepo.updateLastNote(threadId, content, type, timestamp)
}
