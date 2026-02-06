import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDb } from './DatabaseContext'
import { getThreadRepository } from '@/services/repositories'
import {
  getMinimalMode,
  setMinimalMode as storeMinimalMode,
  getMinimalModeThreadId,
  setMinimalModeThreadId as storeMinimalModeThreadId,
} from '@/services/storage'

interface MinimalModeContextValue {
  isMinimalMode: boolean
  minimalThreadId: string | null
  enableMinimalMode: () => Promise<void>
  disableMinimalMode: () => Promise<void>
}

const MinimalModeContext = createContext<MinimalModeContextValue | null>(null)

export function MinimalModeProvider({ children }: { children: React.ReactNode }) {
  const db = useDb()
  const queryClient = useQueryClient()
  const [isMinimalMode, setIsMinimalMode] = useState(false)
  const [minimalThreadId, setMinimalThreadId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getMinimalMode(), getMinimalModeThreadId()]).then(
      ([enabled, threadId]) => {
        setIsMinimalMode(enabled)
        setMinimalThreadId(threadId)
      }
    )
  }, [])

  const enableMinimalMode = useCallback(async () => {
    const threadRepo = getThreadRepository(db)

    // Look for existing "Minimal Mode" thread
    const result = await threadRepo.getAll({ search: 'Minimal Mode' })
    let threadId: string | null = null

    const exactMatch = result.data.find((t) => t.name === 'Minimal Mode')
    if (exactMatch) {
      threadId = exactMatch.id
    } else {
      // Create a new thread
      const newThread = await threadRepo.create({ name: 'Minimal Mode' })
      threadId = newThread.id
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    }

    await storeMinimalModeThreadId(threadId)
    await storeMinimalMode(true)
    setMinimalThreadId(threadId)
    setIsMinimalMode(true)
  }, [db, queryClient])

  const disableMinimalMode = useCallback(async () => {
    await storeMinimalMode(false)
    setIsMinimalMode(false)
  }, [])

  const value = useMemo<MinimalModeContextValue>(
    () => ({ isMinimalMode, minimalThreadId, enableMinimalMode, disableMinimalMode }),
    [isMinimalMode, minimalThreadId, enableMinimalMode, disableMinimalMode]
  )

  return (
    <MinimalModeContext.Provider value={value}>{children}</MinimalModeContext.Provider>
  )
}

export function useMinimalMode(): MinimalModeContextValue {
  const ctx = useContext(MinimalModeContext)
  if (!ctx) throw new Error('useMinimalMode must be used within MinimalModeProvider')
  return ctx
}
