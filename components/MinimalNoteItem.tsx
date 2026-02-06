import { Ionicons } from '@expo/vector-icons'
import { memo } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

import { useNoteFontScale } from '@/contexts/FontScaleContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import type { NoteWithDetails } from '@/services/database/types'

interface MinimalNoteItemProps {
  note: NoteWithDetails
  onLongPress: (note: NoteWithDetails) => void
  onPress: (note: NoteWithDetails) => void
  onTaskToggle?: (note: NoteWithDetails) => void
  isSelected: boolean
}

function MinimalNoteItemComponent({
  note,
  onLongPress,
  onPress,
  onTaskToggle,
  isSelected,
}: MinimalNoteItemProps) {
  const { fontScale } = useNoteFontScale()
  const { color, warningColor } = useThemeColor()
  const baseFontSize = 15

  const timestamp = new Date(note.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  const content = note.content || `[${note.type}]`

  return (
    <Pressable
      onPress={() => onPress(note)}
      onLongPress={() => onLongPress(note)}
      delayLongPress={300}
    >
      <YStack
        paddingHorizontal="$4"
        paddingVertical="$2"
        backgroundColor={isSelected ? '$yellow4' : 'transparent'}
      >
        <XStack alignItems="center" gap="$1.5">
          {note.isStarred && (
            <Ionicons name="star" size={12} color={warningColor} />
          )}
          {note.task?.isTask && (
            <Pressable
              onPress={() => onTaskToggle?.(note)}
              hitSlop={8}
            >
              <Ionicons
                name={note.task.isCompleted ? 'checkbox' : 'square-outline'}
                size={14}
                color={color}
              />
            </Pressable>
          )}
          <Text
            fontSize={baseFontSize * fontScale * 0.8}
            color="$colorSubtle"
          >
            {timestamp}
          </Text>
        </XStack>
        <Text
          fontSize={baseFontSize * fontScale}
          color="$color"
          textDecorationLine={note.task?.isCompleted ? 'line-through' : 'none'}
          opacity={note.task?.isCompleted ? 0.5 : 1}
        >
          {content}
        </Text>
        {note.task?.isTask && note.task.reminderAt && (
          <XStack alignItems="center" gap="$1" marginTop="$0.5">
            <Ionicons name="alarm" size={10} color={color} />
            <Text fontSize={10} color="$colorSubtle">
              {new Date(note.task.reminderAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </XStack>
        )}
      </YStack>
    </Pressable>
  )
}

export const MinimalNoteItem = memo(MinimalNoteItemComponent)
