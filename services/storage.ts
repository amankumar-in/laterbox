import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'
import { DATABASE_NAME } from './database/schema'

const DEVICE_ID_KEY = '@laterbox:deviceId'
const USER_KEY = '@laterbox:user'
const AUTH_TOKEN_KEY = '@laterbox:authToken'
const THEME_KEY = '@laterbox:appTheme'
const SYNC_ENABLED_KEY = '@laterbox:syncEnabled'
const NOTE_FONT_SCALE_KEY = '@laterbox:noteFontScale'
const NOTE_VIEW_STYLE_KEY = '@laterbox:noteViewStyle'
const APP_FONT_KEY = '@laterbox:appFont'
const THREAD_VIEW_STYLE_KEY = '@laterbox:threadViewStyle'
const MINIMAL_MODE_KEY = '@laterbox:minimalMode'
const MINIMAL_MODE_THREAD_ID_KEY = '@laterbox:minimalModeThreadId'

export type AppTheme = 'light' | 'dark' | 'system'

export async function getAppTheme(): Promise<AppTheme> {
  const stored = await AsyncStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

export async function setAppTheme(theme: AppTheme): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme)
}

/** Sync enabled preference. Default true when key is missing (backward compat). */
export async function getSyncEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(SYNC_ENABLED_KEY)
  if (stored === 'false') return false
  return true
}

export async function setSyncEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SYNC_ENABLED_KEY, enabled ? 'true' : 'false')
}

export const FONT_SCALE_STEPS = [0.85, 0.92, 1.0, 1.15, 1.3] as const
export type FontScale = (typeof FONT_SCALE_STEPS)[number]
const DEFAULT_FONT_SCALE: FontScale = 1.0

export async function getNoteFontScale(): Promise<FontScale> {
  const stored = await AsyncStorage.getItem(NOTE_FONT_SCALE_KEY)
  if (stored) {
    const parsed = parseFloat(stored)
    if (FONT_SCALE_STEPS.includes(parsed as FontScale)) return parsed as FontScale
  }
  return DEFAULT_FONT_SCALE
}

export async function setNoteFontScale(scale: FontScale): Promise<void> {
  await AsyncStorage.setItem(NOTE_FONT_SCALE_KEY, String(scale))
}

export type NoteViewStyle = 'bubble' | 'paper'

export async function getNoteViewStyle(): Promise<NoteViewStyle> {
  const stored = await AsyncStorage.getItem(NOTE_VIEW_STYLE_KEY)
  if (stored === 'bubble' || stored === 'paper') return stored
  return 'bubble'
}

export async function setNoteViewStyle(style: NoteViewStyle): Promise<void> {
  await AsyncStorage.setItem(NOTE_VIEW_STYLE_KEY, style)
}

export type AppFont = 'inter' | 'poppins' | 'lora' | 'nunito' | 'jetbrains-mono'

const VALID_FONTS: AppFont[] = ['inter', 'poppins', 'lora', 'nunito', 'jetbrains-mono']

export async function getAppFont(): Promise<AppFont> {
  const stored = await AsyncStorage.getItem(APP_FONT_KEY)
  if (stored && VALID_FONTS.includes(stored as AppFont)) return stored as AppFont
  return 'inter'
}

export async function setAppFont(font: AppFont): Promise<void> {
  await AsyncStorage.setItem(APP_FONT_KEY, font)
}

export type ThreadViewStyle = 'list' | 'icons'

export async function getThreadViewStyle(): Promise<ThreadViewStyle> {
  const stored = await AsyncStorage.getItem(THREAD_VIEW_STYLE_KEY)
  if (stored === 'list' || stored === 'icons') return stored
  return 'list'
}

export async function setThreadViewStyle(style: ThreadViewStyle): Promise<void> {
  await AsyncStorage.setItem(THREAD_VIEW_STYLE_KEY, style)
}

export async function getMinimalMode(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(MINIMAL_MODE_KEY)
  return stored === 'true'
}

export async function setMinimalMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MINIMAL_MODE_KEY, enabled ? 'true' : 'false')
}

export async function getMinimalModeThreadId(): Promise<string | null> {
  return AsyncStorage.getItem(MINIMAL_MODE_THREAD_ID_KEY)
}

export async function setMinimalModeThreadId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(MINIMAL_MODE_THREAD_ID_KEY, id)
  } else {
    await AsyncStorage.removeItem(MINIMAL_MODE_THREAD_ID_KEY)
  }
}

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const platformPart = Platform.OS.substring(0, 3)
  return `${platformPart}-${timestamp}-${randomPart}`
}

export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = generateId()
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

export async function clearDeviceId(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_ID_KEY)
}

export async function getStoredUser<T>(): Promise<T | null> {
  const userJson = await AsyncStorage.getItem(USER_KEY)
  if (userJson) {
    return JSON.parse(userJson)
  }
  return null
}

export async function setStoredUser<T>(user: T): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function clearStoredUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY)
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY)
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([DEVICE_ID_KEY, USER_KEY, AUTH_TOKEN_KEY, THEME_KEY, SYNC_ENABLED_KEY, NOTE_FONT_SCALE_KEY, NOTE_VIEW_STYLE_KEY, APP_FONT_KEY, THREAD_VIEW_STYLE_KEY, MINIMAL_MODE_KEY, MINIMAL_MODE_THREAD_ID_KEY])
}

/**
 * Factory reset - deletes SQLite database and all AsyncStorage data
 * App must be restarted after calling this
 */
export async function factoryReset(): Promise<void> {
  // Clear all AsyncStorage
  await AsyncStorage.clear()

  // Delete the SQLite database file
  const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`
  const dbInfo = await FileSystem.getInfoAsync(dbPath)
  if (dbInfo.exists) {
    await FileSystem.deleteAsync(dbPath, { idempotent: true })
  }

  // Also delete WAL and SHM files if they exist
  const walPath = `${dbPath}-wal`
  const shmPath = `${dbPath}-shm`
  await FileSystem.deleteAsync(walPath, { idempotent: true }).catch(() => {})
  await FileSystem.deleteAsync(shmPath, { idempotent: true }).catch(() => {})
}
