import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getLinkPreviewMode, setLinkPreviewMode as persistLinkPreviewMode, type LinkPreviewMode } from '@/services/storage'

interface LinkPreviewContextValue {
  linkPreviewMode: LinkPreviewMode
  setLinkPreviewMode: (mode: LinkPreviewMode) => Promise<void>
}

const LinkPreviewContext = createContext<LinkPreviewContextValue | null>(null)

export function LinkPreviewProvider({ children }: { children: React.ReactNode }) {
  const [linkPreviewMode, setLinkPreviewState] = useState<LinkPreviewMode>('text+image')

  useEffect(() => {
    getLinkPreviewMode().then(setLinkPreviewState)
  }, [])

  const setLinkPreviewMode = useCallback(async (mode: LinkPreviewMode) => {
    setLinkPreviewState(mode)
    await persistLinkPreviewMode(mode)
  }, [])

  const value = useMemo<LinkPreviewContextValue>(
    () => ({ linkPreviewMode, setLinkPreviewMode }),
    [linkPreviewMode, setLinkPreviewMode]
  )

  return <LinkPreviewContext.Provider value={value}>{children}</LinkPreviewContext.Provider>
}

export function useLinkPreviewMode(): LinkPreviewContextValue {
  const ctx = useContext(LinkPreviewContext)
  if (!ctx) throw new Error('useLinkPreviewMode must be used within LinkPreviewProvider')
  return ctx
}
