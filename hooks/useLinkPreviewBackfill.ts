import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useDb } from '@/contexts/DatabaseContext'
import { getNoteRepository } from '@/services/repositories'
import { getLinkPreviewMode } from '@/services/storage'
import { extractFirstUrl, fetchLinkPreview } from '@/services/linkPreview'
import { useSyncService } from './useSyncService'

/**
 * Silently backfills link previews for text notes that contain URLs but
 * were saved without preview data (e.g. created while offline).
 *
 * Runs once on mount and again each time the app returns to foreground.
 * Respects the link preview mode setting — does nothing when set to 'off'.
 * All errors are swallowed so the user never sees failures.
 */
export function useLinkPreviewBackfill() {
  const db = useDb()
  const queryClient = useQueryClient()
  const { schedulePush } = useSyncService()
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const isRunningRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function backfill() {
      // Guard against concurrent runs
      if (isRunningRef.current || cancelled) return
      isRunningRef.current = true

      try {
        const mode = await getLinkPreviewMode()
        if (mode === 'off' || cancelled) return

        const noteRepo = getNoteRepository(db)
        const notes = await noteRepo.getNotesNeedingLinkPreview(10)
        if (notes.length === 0 || cancelled) return

        let updatedCount = 0

        for (const note of notes) {
          if (cancelled) break

          const url = note.content ? extractFirstUrl(note.content) : null
          if (!url) continue

          try {
            const preview = await fetchLinkPreview(url, mode)
            if (cancelled) break

            // Only update if we got meaningful data
            if (preview.title || preview.description) {
              await noteRepo.updateLinkPreview(note.id, {
                url: preview.url,
                title: preview.title ?? undefined,
                description: preview.description ?? undefined,
                image: preview.localImage ?? preview.imageUrl ?? undefined,
              })
              updatedCount++
            }
          } catch {
            // Individual preview fetch failed — skip silently, will retry next foreground
          }
        }

        if (updatedCount > 0 && !cancelled) {
          queryClient.invalidateQueries({ queryKey: ['notes'] })
          schedulePush()
        }
      } catch {
        // Entire backfill failed — swallow silently
      } finally {
        isRunningRef.current = false
      }
    }

    // Run on mount
    backfill()

    // Run on foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        backfill()
      }
      appStateRef.current = nextAppState
    })

    return () => {
      cancelled = true
      subscription.remove()
    }
  }, [db, queryClient, schedulePush])
}
