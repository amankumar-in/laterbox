import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { reloadAppAsync } from 'expo'
import { getAppFont, setAppFont, type AppFont } from '@/services/storage'

interface FontFamilyContextValue {
  fontFamily: AppFont
  setFontFamily: (font: AppFont) => Promise<void>
}

const FontFamilyContext = createContext<FontFamilyContextValue | null>(null)

export function FontFamilyProvider({ children }: { children: React.ReactNode }) {
  const [fontFamily, setFontFamilyState] = useState<AppFont>('inter')

  useEffect(() => {
    getAppFont().then(setFontFamilyState)
  }, [])

  const setFontFamily = useCallback(async (font: AppFont) => {
    setFontFamilyState(font)
    await setAppFont(font)
    try {
      await reloadAppAsync()
    } catch {
      // reloadAppAsync may fail on web or in some environments; font will apply on next app open
    }
  }, [])

  const value = useMemo<FontFamilyContextValue>(
    () => ({ fontFamily, setFontFamily }),
    [fontFamily, setFontFamily]
  )

  return <FontFamilyContext.Provider value={value}>{children}</FontFamilyContext.Provider>
}

export function useAppFont(): FontFamilyContextValue {
  const ctx = useContext(FontFamilyContext)
  if (!ctx) throw new Error('useAppFont must be used within FontFamilyProvider')
  return ctx
}
