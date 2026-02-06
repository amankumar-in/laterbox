import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getNoteViewStyle, setNoteViewStyle, type NoteViewStyle } from '@/services/storage'

interface NoteViewContextValue {
  noteViewStyle: NoteViewStyle
  setViewStyle: (style: NoteViewStyle) => Promise<void>
}

const NoteViewContext = createContext<NoteViewContextValue | null>(null)

export function NoteViewProvider({ children }: { children: React.ReactNode }) {
  const [noteViewStyle, setNoteViewState] = useState<NoteViewStyle>('bubble')

  useEffect(() => {
    getNoteViewStyle().then(setNoteViewState)
  }, [])

  const setViewStyle = useCallback(async (style: NoteViewStyle) => {
    setNoteViewState(style)
    await setNoteViewStyle(style)
  }, [])

  const value = useMemo<NoteViewContextValue>(
    () => ({ noteViewStyle, setViewStyle }),
    [noteViewStyle, setViewStyle]
  )

  return <NoteViewContext.Provider value={value}>{children}</NoteViewContext.Provider>
}

export function useNoteViewStyle(): NoteViewContextValue {
  const ctx = useContext(NoteViewContext)
  if (!ctx) throw new Error('useNoteViewStyle must be used within NoteViewProvider')
  return ctx
}
