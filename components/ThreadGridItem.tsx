import { XStack, YStack, Text } from 'tamagui'
import { Image, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../hooks/useThemeColor'
import NotebookIcon from '@/assets/images/notebook-icon.svg'
import type { ThreadWithLastNote } from '../types'

interface ThreadGridItemProps {
  thread: ThreadWithLastNote
  onPress: () => void
  onLongPress: () => void
  isSelected?: boolean
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const ICON_WIDTH = 80
const ICON_HEIGHT = 100
const AVATAR_SIZE = 36

export function ThreadGridItem({ thread, onPress, onLongPress, isSelected }: ThreadGridItemProps) {
  const { accentColor } = useThemeColor()

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flex: 1 / 3,
        alignItems: 'center',
        paddingVertical: 10,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <YStack alignItems="center" gap="$1.5">
        {/* Notebook icon with avatar overlay */}
        <YStack width={ICON_WIDTH} height={ICON_HEIGHT} alignItems="center" justifyContent="center">
          <NotebookIcon width={ICON_WIDTH} height={ICON_HEIGHT} />

          {/* Avatar centered on the notebook */}
          <XStack
            position="absolute"
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            borderRadius={AVATAR_SIZE / 2}
            backgroundColor="$backgroundTinted"
            alignItems="center"
            justifyContent="center"
            top={(ICON_HEIGHT - AVATAR_SIZE) / 2 - 4}
          >
            {thread.icon && (thread.icon.startsWith('file://') || thread.icon.startsWith('content://')) ? (
              <Image
                source={{ uri: thread.icon }}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
              />
            ) : thread.icon ? (
              <Text fontSize="$4">{thread.icon}</Text>
            ) : (
              <Text color="$accentColor" fontSize={12} fontWeight="600">
                {getInitials(thread.name)}
              </Text>
            )}
          </XStack>

          {/* Selection overlay */}
          {isSelected && (
            <XStack
              position="absolute"
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              borderRadius={AVATAR_SIZE / 2}
              backgroundColor="$accentColor"
              opacity={0.85}
              alignItems="center"
              justifyContent="center"
              top={(ICON_HEIGHT - AVATAR_SIZE) / 2 - 4}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </XStack>
          )}
        </YStack>

        {/* Thread name */}
        <Text
          fontSize="$2"
          color="$color"
          numberOfLines={1}
          textAlign="center"
          width={ICON_WIDTH + 16}
          ellipsizeMode="tail"
        >
          {thread.name}
        </Text>
      </YStack>
    </Pressable>
  )
}
