import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { Audio } from 'expo-av'
import { saveAttachment } from '../services/fileStorage'
import type { AttachmentResult } from './useAttachmentHandler'

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
}

const MAX_WAVEFORM_BARS = 40

export function useVoiceRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [meteringLevels, setMeteringLevels] = useState<number[]>([])

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record voice notes.')
        return false
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      setDuration(0)
      setMeteringLevels([])

      const { recording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS,
        (status) => {
          if (status.isRecording) {
            setDuration(Math.floor(status.durationMillis / 1000))
            if (status.metering !== undefined) {
              // Normalize dB (-160 to 0) to 0-1 range, clamping around -60 to 0 for useful range
              const normalized = Math.min(1, Math.max(0, (status.metering + 60) / 60))
              setMeteringLevels(prev => {
                const next = [...prev, normalized]
                return next.length > MAX_WAVEFORM_BARS ? next.slice(-MAX_WAVEFORM_BARS) : next
              })
            }
          }
        },
        100 // Update every 100ms
      )

      recordingRef.current = recording
      setIsRecording(true)
      return true
    } catch (error) {
      console.warn('[VoiceRecorder] Failed to start:', error)
      return false
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<AttachmentResult | null> => {
    const recording = recordingRef.current
    if (!recording) return null

    try {
      const status = await recording.getStatusAsync()
      const finalDuration = Math.floor((status.durationMillis || 0) / 1000)

      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false })

      const uri = recording.getURI()
      recordingRef.current = null
      setIsRecording(false)

      if (!uri) return null

      // Skip very short recordings (< 1 second)
      if (finalDuration < 1) return null

      const filename = `voice_${Date.now()}.m4a`
      const saved = await saveAttachment(uri, 'audio', filename)

      return {
        type: 'voice',
        localUri: saved.localUri,
        filename: saved.filename,
        mimeType: 'audio/mp4',
        duration: finalDuration,
      }
    } catch (error) {
      console.warn('[VoiceRecorder] Failed to stop:', error)
      recordingRef.current = null
      setIsRecording(false)
      return null
    }
  }, [])

  const cancelRecording = useCallback(async () => {
    const recording = recordingRef.current
    if (!recording) return

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
    } catch {
      // Ignore cleanup errors
    }
    recordingRef.current = null
    setIsRecording(false)
    setDuration(0)
    setMeteringLevels([])
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {})
      }
    }
  }, [])

  return {
    isRecording,
    duration,
    meteringLevels,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
