import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { getAppTheme, setAppTheme, type AppTheme } from '@/services/storage'

type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: AppTheme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: AppTheme) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [theme, setThemeState] = useState<AppTheme>('system')

  useEffect(() => {
    getAppTheme().then(setThemeState)
  }, [])

  const setTheme = useCallback(async (next: AppTheme) => {
    setThemeState(next)
    await setAppTheme(next)
  }, [])

  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider')
  return ctx
}
