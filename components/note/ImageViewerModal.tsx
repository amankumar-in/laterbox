import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ImageViewerModalProps {
  uri: string | null
  onClose: () => void
}

export function ImageViewerModal({ uri, onClose }: ImageViewerModalProps) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          {uri && (
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
            />
          )}
        </Pressable>
        <Pressable
          onPress={onClose}
          style={[styles.closeButton, { top: insets.top + 10 }]}
        >
          <Ionicons name="close-circle" size={32} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  backdrop: { flex: 1, justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  closeButton: { position: 'absolute', right: 16, padding: 8, zIndex: 10 },
})
