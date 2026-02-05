import { useCallback, useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useDb } from '@/contexts/DatabaseContext'
import { getSyncEnabled } from '@/services/storage'
import { getSyncService, type SyncService } from '@/services/sync/sync.service'

interface SyncServiceHook {
  sync: () => Promise<void>
  pull: () => Promise<void>
  push: () => Promise<void>
  schedulePush: () => void
}

/**
 * Hook to access and use the sync service
 */
export function useSyncService(): SyncServiceHook {
  const db = useDb()
  const queryClient = useQueryClient()
  const syncServiceRef = useRef<SyncService | null>(null)

  // Get or create sync service instance
  if (!syncServiceRef.current) {
    syncServiceRef.current = getSyncService(db)
  }

  const syncService = syncServiceRef.current

  const invalidateAllQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['threads'] })
    queryClient.invalidateQueries({ queryKey: ['notes'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['user'] })
    queryClient.invalidateQueries({ queryKey: ['search'] })
  }, [queryClient])

  const sync = useCallback(async () => {
    await syncService.sync()
    invalidateAllQueries()
  }, [syncService, invalidateAllQueries])

  const pull = useCallback(async () => {
    await syncService.pull()
    invalidateAllQueries()
  }, [syncService, invalidateAllQueries])

  const push = useCallback(async () => {
    await syncService.push()
    invalidateAllQueries()
  }, [syncService])

  const schedulePush = useCallback(() => {
    syncService.schedulePush()
  }, [syncService])

  return { sync, pull, push, schedulePush }
}

/**
 * Hook to auto-sync when app comes to foreground.
 * Respects the persisted "Data Sync" setting; if sync is disabled in settings, no sync runs.
 */
export function useAutoSync() {
  const { push, pull } = useSyncService()
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    let cancelled = false
    let subscription: { remove: () => void } | null = null

    getSyncEnabled().then((enabled) => {
      if (cancelled || !enabled) return

      subscription = AppState.addEventListener('change', (nextAppState) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          push()
            .catch((error) => {
              if (error?.message === 'AUTH_CLEARED') return
              console.log('[AutoSync] Push failed (offline?):', error.message)
            })
            .then(() => pull())
            .catch((error) => {
              if (error?.message === 'AUTH_CLEARED') return
              console.log('[AutoSync] Pull failed (offline?):', error.message)
            })
        }
        appStateRef.current = nextAppState
      })

      push()
        .catch((error) => {
          if (error?.message === 'AUTH_CLEARED') return
          console.log('[AutoSync] Initial push failed (offline?):', error.message)
        })
        .then(() => pull())
        .catch((error) => {
          if (error?.message === 'AUTH_CLEARED') return
          console.log('[AutoSync] Initial pull failed (offline?):', error.message)
        })
    })

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [push, pull])
}
