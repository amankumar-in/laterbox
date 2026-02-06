import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getThreadViewStyle, setThreadViewStyle, type ThreadViewStyle } from '@/services/storage'

interface ThreadViewContextValue {
  threadViewStyle: ThreadViewStyle
  setViewStyle: (style: ThreadViewStyle) => Promise<void>
}

const ThreadViewContext = createContext<ThreadViewContextValue | null>(null)

export function ThreadViewProvider({ children }: { children: React.ReactNode }) {
  const [threadViewStyle, setThreadViewState] = useState<ThreadViewStyle>('list')

  useEffect(() => {
    getThreadViewStyle().then(setThreadViewState)
  }, [])

  const setViewStyle = useCallback(async (style: ThreadViewStyle) => {
    setThreadViewState(style)
    await setThreadViewStyle(style)
  }, [])

  const value = useMemo<ThreadViewContextValue>(
    () => ({ threadViewStyle, setViewStyle }),
    [threadViewStyle, setViewStyle]
  )

  return <ThreadViewContext.Provider value={value}>{children}</ThreadViewContext.Provider>
}

export function useThreadViewStyle(): ThreadViewContextValue {
  const ctx = useContext(ThreadViewContext)
  if (!ctx) throw new Error('useThreadViewStyle must be used within ThreadViewProvider')
  return ctx
}
