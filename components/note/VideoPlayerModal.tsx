import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface VideoPlayerModalProps {
  uri: string | null
  onClose: () => void
}

export function VideoPlayerModal({ uri, onClose }: VideoPlayerModalProps) {
  if (!uri) return null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <VideoPlayerContent uri={uri} onClose={onClose} />
    </Modal>
  )
}

function VideoPlayerContent({ uri, onClose }: { uri: string; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const player = useVideoPlayer(uri, (player) => {
    player.play()
  })

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
      />
      <Pressable
        onPress={onClose}
        style={[styles.closeButton, { top: insets.top + 10 }]}
      >
        <Ionicons name="close-circle" size={32} color="#fff" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
  closeButton: { position: 'absolute', right: 16, padding: 8, zIndex: 10 },
})
