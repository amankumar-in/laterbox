import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const DEVICE_ID_KEY = '@mneme:deviceId'
const USER_KEY = '@mneme:user'

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

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([DEVICE_ID_KEY, USER_KEY])
}
