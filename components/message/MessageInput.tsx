import { useState, useCallback } from 'react'
import { XStack, YStack, Input, Button, Text } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { Keyboard } from 'react-native'
import { useKeyboardState } from 'react-native-keyboard-controller'
import { useThemeColor } from '../../hooks/useThemeColor'
import type { Message, MessageType } from '../../types'

const attachmentOptions = [
  { id: 'image', icon: 'image-outline', label: 'Image', color: '$purple5' },
  { id: 'video', icon: 'videocam-outline', label: 'Video', color: '$red5' },
  { id: 'document', icon: 'document-outline', label: 'Document', color: '$blue5' },
  { id: 'location', icon: 'location-outline', label: 'Location', color: '$green5' },
  { id: 'contact', icon: 'person-outline', label: 'Contact', color: '$orange5' },
  { id: 'audio', icon: 'musical-notes-outline', label: 'Audio', color: '$pink5' },
] as const

interface MessageInputProps {
  onSend: (message: { content?: string; type: MessageType }) => void
  onAttachmentSelect: (type: string) => void
  onVoiceStart: () => void
  onVoiceEnd: (uri: string) => void
  editingMessage?: Message | null
  onCancelEdit?: () => void
}

export function MessageInput({
  onSend,
  onAttachmentSelect,
  onVoiceStart,
  onVoiceEnd,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const { iconColor, brandText } = useThemeColor()
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const keyboard = useKeyboardState()
  const isKeyboardOpen = keyboard.height > 0

  const handleSend = useCallback(() => {
    const trimmedText = text.trim()
    if (trimmedText) {
      onSend({ content: trimmedText, type: 'text' })
      setText('')
      Keyboard.dismiss()
    }
  }, [text, onSend])

  const handleVoicePress = useCallback(() => {
    if (!isRecording) {
      setIsRecording(true)
      onVoiceStart()
    }
  }, [isRecording, onVoiceStart])

  const handleVoiceRelease = useCallback(() => {
    if (isRecording) {
      setIsRecording(false)
      onVoiceEnd('')
    }
  }, [isRecording, onVoiceEnd])

  const handleAttachmentToggle = useCallback(() => {
    setShowAttachments((prev) => !prev)
  }, [])

  const handleAttachmentPress = useCallback((id: string) => {
    setShowAttachments(false)
    onAttachmentSelect(id)
  }, [onAttachmentSelect])

  const hasText = text.trim().length > 0

  const attachmentPanel = showAttachments && (
    <XStack
      backgroundColor="$background"
      paddingHorizontal="$4"
      paddingVertical="$3"
      flexWrap="wrap"
      justifyContent="flex-start"
      gap="$4"
    >
      {attachmentOptions.map((option) => (
        <YStack
          key={option.id}
          alignItems="center"
          gap="$1"
          width="28%"
          pressStyle={{ opacity: 0.7 }}
          onPress={() => handleAttachmentPress(option.id)}
        >
          <XStack
            width={52}
            height={52}
            borderRadius={14}
            backgroundColor={option.color}
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name={option.icon as any} size={26} color={iconColor} />
          </XStack>
          <Text fontSize="$1" color="$colorSubtle">{option.label}</Text>
        </YStack>
      ))}
    </XStack>
  )

  return (
    <YStack
      borderTopWidth={1}
      borderTopColor="$borderColor"
      backgroundColor="$background"
    >
      {!isKeyboardOpen && attachmentPanel}

      {editingMessage && (
        <XStack
          backgroundColor="$backgroundStrong"
          paddingHorizontal="$4"
          paddingVertical="$2"
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack alignItems="center" gap="$2">
            <Ionicons name="pencil" size={16} color={iconColor} />
            <Text fontSize="$2" color="$colorSubtle" numberOfLines={1} flex={1}>
              Editing: {editingMessage.content}
            </Text>
          </XStack>
          <Button size="$2" circular chromeless onPress={onCancelEdit}>
            <Ionicons name="close" size={18} color={iconColor} />
          </Button>
        </XStack>
      )}

      <XStack
        paddingHorizontal="$2"
        paddingVertical="$2"
        alignItems="flex-end"
        gap="$2"
      >
        <Button
          size="$3"
          circular
          chromeless
          onPress={handleAttachmentToggle}
          icon={<Ionicons name={showAttachments ? 'close' : 'add'} size={24} color={iconColor} />}
        />

        <XStack
          flex={1}
          backgroundColor="$backgroundStrong"
          borderRadius="$4"
          minHeight={44}
          maxHeight={120}
          alignItems="center"
        >
          <Input
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            placeholder="Type a message..."
            placeholderTextColor="$colorMuted"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={5000}
            returnKeyType="default"
            paddingHorizontal="$3"
          />
        </XStack>

        {hasText ? (
          <Button
            size="$4"
            circular
            backgroundColor="$brandBackground"
            pressStyle={{ backgroundColor: '$brandBackgroundHover', scale: 0.95 }}
            onPress={handleSend}
            icon={<Ionicons name="send" size={20} color={brandText} />}
          />
        ) : (
          <Button
            size="$4"
            circular
            backgroundColor={isRecording ? '$errorColor' : '$brandBackground'}
            pressStyle={{ backgroundColor: isRecording ? '$errorColor' : '$brandBackgroundHover', scale: 0.95 }}
            onPressIn={handleVoicePress}
            onPressOut={handleVoiceRelease}
            icon={<Ionicons name="mic" size={20} color={brandText} />}
          />
        )}
      </XStack>

      {isKeyboardOpen && attachmentPanel}

      {isRecording && (
        <XStack
          backgroundColor="$red3"
          paddingHorizontal="$4"
          paddingVertical="$2"
          alignItems="center"
          justifyContent="center"
          gap="$2"
        >
          <XStack
            width={8}
            height={8}
            borderRadius={4}
            backgroundColor="$errorColor"
          />
          <Text color="$red11" fontSize="$3">
            Recording... Release to send
          </Text>
        </XStack>
      )}
    </YStack>
  )
}
