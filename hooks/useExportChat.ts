import { useCallback, useState } from 'react'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useDb } from '@/contexts/DatabaseContext'
import { getMessageRepository, getChatRepository } from '@/services/repositories'

interface ExportState {
  isExporting: boolean
  error: string | null
}

export function useExportChat() {
  const db = useDb()
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    error: null,
  })

  const handleExport = useCallback(async (chatId: string, chatName: string) => {
    setState({ isExporting: true, error: null })

    try {
      const chatRepo = getChatRepository(db)
      const messageRepo = getMessageRepository(db)

      // Get chat info
      const chat = await chatRepo.getById(chatId)
      if (!chat) {
        throw new Error('Chat not found')
      }

      // Get all messages for this chat
      const allMessages: string[] = []
      let hasMore = true
      let cursor: string | undefined

      while (hasMore) {
        const result = await messageRepo.getByChat(chatId, { before: cursor, limit: 100 })
        // Messages come newest first, we want oldest first for export
        const messagesFormatted = result.data.reverse().map(msg => {
          const date = new Date(msg.createdAt).toLocaleString()
          let content = msg.content || ''

          if (msg.type === 'image') content = '[Image]'
          else if (msg.type === 'voice') content = '[Voice Note]'
          else if (msg.type === 'file') content = `[File: ${msg.attachment?.filename || 'attachment'}]`
          else if (msg.type === 'location') content = `[Location: ${msg.location?.address || 'shared location'}]`

          if (msg.task.isTask) {
            content = `[${msg.task.isCompleted ? '✓' : '○'}] ${content}`
          }

          return `[${date}] ${content}`
        })

        allMessages.push(...messagesFormatted)
        hasMore = result.hasMore
        if (result.data.length > 0) {
          cursor = result.data[0].createdAt // oldest in this batch (we reversed)
        }
      }

      // Reverse to get chronological order
      allMessages.reverse()

      // Build export text
      const exportText = [
        `# ${chat.name}`,
        `Exported on ${new Date().toLocaleString()}`,
        `Total messages: ${allMessages.length}`,
        '',
        '---',
        '',
        ...allMessages,
      ].join('\n')

      // Create filename with sanitized chat name
      const sanitizedName = chatName.replace(/[^a-zA-Z0-9]/g, '_')
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${sanitizedName}_${timestamp}.txt`

      // Create file in cache directory (no permissions needed)
      const file = new File(Paths.cache, filename)

      // Write text content to file
      await file.write(exportText)

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device')
      }

      // Share the file
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/plain',
        dialogTitle: `Export ${chatName}`,
      })

      // Clean up temp file after sharing
      await file.delete()

      setState({ isExporting: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      setState({ isExporting: false, error: message })
      throw error
    }
  }, [db])

  return {
    exportChat: handleExport,
    isExporting: state.isExporting,
    exportError: state.error,
  }
}
