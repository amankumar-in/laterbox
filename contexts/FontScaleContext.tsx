import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getNoteFontScale, setNoteFontScale, type FontScale } from '@/services/storage'

interface FontScaleContextValue {
  fontScale: FontScale
  setFontScale: (scale: FontScale) => Promise<void>
}

const FontScaleContext = createContext<FontScaleContextValue | null>(null)

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>(1.0)

  useEffect(() => {
    getNoteFontScale().then(setFontScaleState)
  }, [])

  const setFontScale = useCallback(async (scale: FontScale) => {
    setFontScaleState(scale)
    await setNoteFontScale(scale)
  }, [])

  const value = useMemo<FontScaleContextValue>(
    () => ({ fontScale, setFontScale }),
    [fontScale, setFontScale]
  )

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>
}

export function useNoteFontScale(): FontScaleContextValue {
  const ctx = useContext(FontScaleContext)
  if (!ctx) throw new Error('useNoteFontScale must be used within FontScaleProvider')
  return ctx
}
