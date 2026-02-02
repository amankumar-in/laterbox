import { XStack, YStack, Text } from 'tamagui'
import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'
import type { Message } from '../../types'

interface NoteBubbleProps {
  message: Message
  onLongPress: (message: Message) => void
  onTaskToggle?: (message: Message) => void
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function NoteBubble({ message, onLongPress, onTaskToggle }: NoteBubbleProps) {
  const { brandText, iconColor, accentColor, background } = useThemeColor()

  const handleLongPress = () => {
    onLongPress(message)
  }

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <YStack>
            <XStack
              backgroundColor="$backgroundStrong"
              borderRadius="$3"
              width={200}
              height={150}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="image" size={40} color={iconColor} />
            </XStack>
            {message.content && (
              <Text fontSize="$4" marginTop="$2" color={brandText}>
                {message.content}
              </Text>
            )}
          </YStack>
        )

      case 'voice':
        return (
          <XStack alignItems="center" gap="$2" minWidth={180}>
            <XStack
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor={background}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="play" size={20} color={accentColor} />
            </XStack>
            <YStack flex={1} gap="$1">
              <XStack height={20} backgroundColor="$blue8" borderRadius="$2" />
              <Text fontSize="$2" color="$blue12">
                {message.attachment?.duration
                  ? formatDuration(message.attachment.duration)
                  : '0:00'}
              </Text>
            </YStack>
          </XStack>
        )

      case 'file':
        return (
          <XStack alignItems="center" gap="$2" minWidth={180}>
            <XStack
              width={40}
              height={40}
              borderRadius="$2"
              backgroundColor="$blue8"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="document" size={24} color={brandText} />
            </XStack>
            <YStack flex={1}>
              <Text fontSize="$3" fontWeight="500" numberOfLines={1} color={brandText}>
                {message.attachment?.filename || 'File'}
              </Text>
              <Text fontSize="$2" color="$blue12">
                {message.attachment?.size
                  ? `${(message.attachment.size / 1024).toFixed(1)} KB`
                  : ''}
              </Text>
            </YStack>
          </XStack>
        )

      case 'location':
        return (
          <YStack>
            <XStack
              backgroundColor="$backgroundStrong"
              borderRadius="$3"
              width={200}
              height={120}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="location" size={40} color={iconColor} />
            </XStack>
            {message.location?.address && (
              <Text fontSize="$3" marginTop="$2" color="$blue12">
                {message.location.address}
              </Text>
            )}
          </YStack>
        )

      default:
        return (
          <Text fontSize="$4" color={brandText}>
            {message.content}
          </Text>
        )
    }
  }

  return (
    <Pressable onLongPress={handleLongPress}>
      <XStack justifyContent="flex-end" paddingHorizontal="$4" marginVertical="$1">
        <YStack
          backgroundColor="$brandBackground"
          paddingHorizontal="$3"
          paddingTop="$2"
          paddingBottom="$1"
          borderRadius="$4"
          borderBottomRightRadius="$1"
          maxWidth="80%"
          position="relative"
        >
          {message.task?.isTask && (
            <Pressable
              onPress={() => onTaskToggle?.(message)}
              style={{ position: 'absolute', top: 8, right: 8 }}
            >
              <Ionicons
                name={message.task.isCompleted ? 'checkbox' : 'square-outline'}
                size={20}
                color={brandText}
              />
            </Pressable>
          )}

          <YStack paddingRight={message.task?.isTask ? '$6' : 0}>
            {renderContent()}
          </YStack>

          <XStack justifyContent="flex-end" alignItems="center" gap="$1" marginTop="$1">
            {message.isLocked && (
              <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.7)" />
            )}
            {message.isEdited && (
              <Text fontSize={10} color="$blue12" marginRight="$1">
                edited
              </Text>
            )}
            <Text fontSize={10} color="$blue12">
              {formatTime(message.createdAt)}
            </Text>
          </XStack>

          {message.task?.isTask && message.task.reminderAt && (
            <XStack
              alignItems="center"
              gap="$1"
              marginTop="$1"
              paddingTop="$1"
              borderTopWidth={1}
              borderTopColor="$blue8"
            >
              <Ionicons name="alarm" size={12} color="rgba(255,255,255,0.7)" />
              <Text fontSize={10} color="$blue12">
                {new Date(message.task.reminderAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </XStack>
          )}
        </YStack>
      </XStack>
    </Pressable>
  )
}
