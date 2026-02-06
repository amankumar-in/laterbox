import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native'
import { Button, Text, XStack } from 'tamagui'

import { useThemeColor } from '@/hooks/useThemeColor'
import type { NoteWithDetails } from '@/services/database/types'

interface MinimalInputProps {
  onSend: (note: { content: string; type: 'text' }) => void
  editingNote?: NoteWithDetails | null
  onCancelEdit?: () => void
}

export function MinimalInput({ onSend, editingNote, onCancelEdit }: MinimalInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<TextInput>(null)
  const { color, placeholderColor, brandText, background, iconColor, backgroundStrong, borderColor, brandBackground } = useThemeColor()

  useEffect(() => {
    if (editingNote) {
      const content = editingNote.content || ''
      setText(content)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelection(content.length, content.length)
      }, 100)
    } else {
      setText('')
    }
  }, [editingNote])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (trimmed) {
      onSend({ content: trimmed, type: 'text' })
      setText('')
    }
  }, [text, onSend])

  const canSend = text.trim().length > 0

  return (
    <>
      {editingNote && (
        <XStack
          backgroundColor="$backgroundStrong"
          paddingLeft="$4"
          paddingRight="$2"
          paddingVertical="$2"
          alignItems="center"
          justifyContent="space-between"
          gap="$2"
        >
          <XStack alignItems="center" gap="$2" flex={1}>
            <Ionicons name="pencil" size={16} color={iconColor} />
            <Text fontSize="$2" color="$colorSubtle" numberOfLines={1} flex={1}>
              Editing note
            </Text>
          </XStack>
          <Button size="$3" circular chromeless onPress={onCancelEdit}>
            <Ionicons name="close" size={20} color={iconColor} />
          </Button>
        </XStack>
      )}
      <XStack
        borderTopWidth={1}
        borderTopColor="$borderColor"
        backgroundColor="$background"
        paddingHorizontal="$3"
        paddingVertical="$2"
        alignItems="flex-end"
        gap="$2"
      >
        <XStack
          flex={1}
          backgroundColor={backgroundStrong}
          borderRadius="$4"
          borderWidth={1}
          borderColor={borderColor}
          paddingHorizontal="$3"
          paddingVertical="$2"
          minHeight={40}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Write a note..."
            placeholderTextColor={placeholderColor}
            multiline
            style={{
              flex: 1,
              color,
              fontSize: 16,
              maxHeight: 120,
              paddingTop: 0,
              paddingBottom: 0,
            }}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </XStack>
        <Button
          size="$4"
          circular
          backgroundColor={canSend ? '$brandBackground' : '$backgroundStrong'}
          pressStyle={canSend ? { backgroundColor: '$brandBackgroundHover', scale: 0.95 } : undefined}
          onPress={handleSend}
          disabled={!canSend}
          icon={<Ionicons name="send" size={20} color={canSend ? brandText : placeholderColor} />}
        />
      </XStack>
    </>
  )
}
