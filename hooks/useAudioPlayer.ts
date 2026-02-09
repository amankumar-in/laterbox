import { useCallback, useEffect, useRef, useState } from 'react'
import { Audio } from 'expo-av'

interface AudioPlayerState {
  noteId: string | null
  isPlaying: boolean
  positionMs: number
  durationMs: number
}

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null)
  const noteIdRef = useRef<string | null>(null)
  const [state, setState] = useState<AudioPlayerState>({
    noteId: null,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
  })

  const toggle = useCallback(async (noteId: string, uri: string) => {
    // Same note - toggle play/pause
    if (noteIdRef.current === noteId && soundRef.current) {
      const status = await soundRef.current.getStatusAsync()
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync()
      } else {
        await soundRef.current.playAsync()
      }
      return
    }

    // Different note - stop previous, play new
    if (soundRef.current) {
      await soundRef.current.unloadAsync()
      soundRef.current = null
    }

    noteIdRef.current = noteId

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 },
        (status) => {
          if (!status.isLoaded || noteIdRef.current !== noteId) return

          setState({
            noteId,
            positionMs: status.positionMillis,
            durationMs: status.durationMillis || 0,
            isPlaying: status.isPlaying,
          })

          if (status.didJustFinish) {
            setState({ noteId: null, isPlaying: false, positionMs: 0, durationMs: 0 })
            noteIdRef.current = null
            soundRef.current?.unloadAsync()
            soundRef.current = null
          }
        }
      )

      soundRef.current = sound
      setState({ noteId, isPlaying: true, positionMs: 0, durationMs: 0 })
    } catch (error) {
      console.warn('[AudioPlayer] Failed to play audio:', error)
      setState({ noteId: null, isPlaying: false, positionMs: 0, durationMs: 0 })
      noteIdRef.current = null
    }
  }, [])

  const seek = useCallback(async (positionMs: number) => {
    if (!soundRef.current) return
    try {
      await soundRef.current.setStatusAsync({ positionMillis: positionMs })
    } catch (error) {
      console.warn('[AudioPlayer] Failed to seek:', error)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync()
    }
  }, [])

  return {
    playingNoteId: state.noteId,
    isPlaying: state.isPlaying,
    positionMs: state.positionMs,
    durationMs: state.durationMs,
    toggle,
    seek,
  }
}
