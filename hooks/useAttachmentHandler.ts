import type { NoteType } from '@/services/database/types'
import { generateThumbnail, saveAttachment } from '@/services/fileStorage'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { ActionSheetIOS, Alert, Platform } from 'react-native'

export interface AttachmentResult {
  type: NoteType
  localUri?: string
  filename?: string
  mimeType?: string
  size?: number
  width?: number
  height?: number
  duration?: number
  thumbnail?: string
  waveform?: number[]
  // Location fields
  latitude?: number
  longitude?: number
  address?: string
  // Contact fields
  contactName?: string
  content?: string
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export function useAttachmentHandler() {
  const router = useRouter()

  async function pickImage(source: 'gallery' | 'camera'): Promise<AttachmentResult | null> {
    const fn = source === 'gallery'
      ? ImagePicker.launchImageLibraryAsync
      : ImagePicker.launchCameraAsync

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.')
        return null
      }
    }

    const result = await fn({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      exif: false,
    })

    if (result.canceled || !result.assets?.[0]) return null

    const asset = result.assets[0]
    const filename = asset.fileName || `photo_${Date.now()}.jpg`

    const saved = await saveAttachment(asset.uri, 'images', filename)

    return {
      type: 'image',
      localUri: saved.localUri,
      filename: saved.filename,
      mimeType: asset.mimeType || 'image/jpeg',
      size: asset.fileSize,
      width: asset.width,
      height: asset.height,
    }
  }

  function showImageSourcePicker(): Promise<AttachmentResult | null> {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) resolve(await pickImage('camera'))
            else if (buttonIndex === 2) resolve(await pickImage('gallery'))
            else resolve(null)
          }
        )
      } else {
        Alert.alert('Add Image', 'Choose a source', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Camera', onPress: async () => resolve(await pickImage('camera')) },
          { text: 'Gallery', onPress: async () => resolve(await pickImage('gallery')) },
        ])
      }
    })
  }

  async function pickVideo(source: 'gallery' | 'camera'): Promise<AttachmentResult | null> {
    const fn = source === 'gallery'
      ? ImagePicker.launchImageLibraryAsync
      : ImagePicker.launchCameraAsync

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to record videos.')
        return null
      }
    }

    const result = await fn({
      mediaTypes: ['videos'],
      videoMaxDuration: 300,
      videoQuality: 1,
      allowsEditing: false,
    })

    if (result.canceled || !result.assets?.[0]) return null

    const asset = result.assets[0]
    const filename = asset.fileName || `video_${Date.now()}.mp4`

    const saved = await saveAttachment(asset.uri, 'videos', filename)
    const thumbnail = await generateThumbnail(saved.localUri)

    return {
      type: 'video',
      localUri: saved.localUri,
      filename: saved.filename,
      mimeType: asset.mimeType || 'video/mp4',
      size: asset.fileSize,
      width: asset.width,
      height: asset.height,
      duration: asset.duration ? asset.duration / 1000 : undefined,
      thumbnail: thumbnail || undefined,
    }
  }

  function showVideoSourcePicker(): Promise<AttachmentResult | null> {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Record Video', 'Choose from Gallery'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) resolve(await pickVideo('camera'))
            else if (buttonIndex === 2) resolve(await pickVideo('gallery'))
            else resolve(null)
          }
        )
      } else {
        Alert.alert('Add Video', 'Choose a source', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Camera', onPress: async () => resolve(await pickVideo('camera')) },
          { text: 'Gallery', onPress: async () => resolve(await pickVideo('gallery')) },
        ])
      }
    })
  }

  async function pickDocument(): Promise<AttachmentResult | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    })

    if (result.canceled || !result.assets?.[0]) return null

    const asset = result.assets[0]

    if (asset.size && asset.size > MAX_FILE_SIZE) {
      Alert.alert('File too large', 'Please select a file smaller than 100MB.')
      return null
    }

    const saved = await saveAttachment(asset.uri, 'documents', asset.name)

    return {
      type: 'file',
      localUri: saved.localUri,
      filename: saved.filename,
      mimeType: asset.mimeType || 'application/octet-stream',
      size: asset.size,
    }
  }

  async function shareLocation(): Promise<AttachmentResult | null> {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required to share your location.')
      return null
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      let address = 'Shared location'
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        if (geocode[0]) {
          const g = geocode[0]
          const parts = [g.name, g.street, g.city, g.region].filter(Boolean)
          address = parts.join(', ') || 'Shared location'
        }
      } catch {
        // Reverse geocode can fail, use coordinates as fallback
      }

      return {
        type: 'location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address,
      }
    } catch (error) {
      Alert.alert('Location error', 'Could not get your current location. Please try again.')
      return null
    }
  }

  function openContactPicker(): void {
    router.push('/contact-picker')
  }

  async function pickAudio(): Promise<AttachmentResult | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*', 'public.audio'],
      copyToCacheDirectory: true,
    })

    if (result.canceled || !result.assets?.[0]) return null

    const asset = result.assets[0]

    if (asset.size && asset.size > MAX_FILE_SIZE) {
      Alert.alert('File too large', 'Please select a file smaller than 100MB.')
      return null
    }

    const saved = await saveAttachment(asset.uri, 'audio', asset.name)

    return {
      type: 'audio',
      localUri: saved.localUri,
      filename: saved.filename,
      mimeType: asset.mimeType || 'audio/mpeg',
      size: asset.size,
    }
  }

  return {
    showImageSourcePicker,
    showVideoSourcePicker,
    pickDocument,
    shareLocation,
    openContactPicker,
    pickAudio,
  }
}
