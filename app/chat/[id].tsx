import { useState, useCallback, useMemo } from 'react'
import { YStack } from 'tamagui'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Alert } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ChatHeader } from '../../components/chat/ChatHeader'
import { MessageList } from '../../components/message/MessageList'
import { MessageInput } from '../../components/message/MessageInput'
import type { Chat, Message, MessageType } from '../../types'

const MOCK_CHAT: Chat = {
  _id: '1',
  name: 'Ideas',
  icon: '💡',
  ownerId: 'user1',
  participants: [],
  isShared: false,
  isPinned: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const MOCK_MESSAGES: Message[] = [
  {
    _id: '1',
    chatId: '1',
    senderId: 'user1',
    content: 'Build a note-taking app with chat UI',
    type: 'text',
    isLocked: false,
    isEdited: false,
    isDeleted: false,
    task: { isTask: false, isCompleted: false },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    _id: '2',
    chatId: '1',
    senderId: 'user1',
    content: 'Use Tamagui for the design system',
    type: 'text',
    isLocked: true,
    isEdited: false,
    isDeleted: false,
    task: { isTask: false, isCompleted: false },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: '3',
    chatId: '1',
    senderId: 'user1',
    content: 'Implement voice notes with waveform visualization',
    type: 'text',
    isLocked: false,
    isEdited: true,
    isDeleted: false,
    task: {
      isTask: true,
      isCompleted: false,
      reminderAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    _id: '4',
    chatId: '1',
    senderId: 'user1',
    content: 'Remember to add dark mode support',
    type: 'text',
    isLocked: false,
    isEdited: false,
    isDeleted: false,
    task: { isTask: true, isCompleted: true, completedAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '5',
    chatId: '1',
    senderId: 'user1',
    content: 'This is an older message from yesterday',
    type: 'text',
    isLocked: false,
    isEdited: false,
    isDeleted: false,
    task: { isTask: false, isCompleted: false },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
]

export default function ChatScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [chat] = useState<Chat>(MOCK_CHAT)

  const taskCount = useMemo(() => {
    return messages.filter((m) => m.task.isTask && !m.task.isCompleted).length
  }, [messages])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleChatPress = useCallback(() => {
    console.log('Chat info:', id)
  }, [id])

  const handleSearch = useCallback(() => {
    console.log('Search in chat:', id)
  }, [id])

  const handleTasks = useCallback(() => {
    router.push('/tasks')
  }, [router])

  const handleMenu = useCallback(() => {
    console.log('Menu:', id)
  }, [id])

  const handleLoadMore = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleSend = useCallback(
    (message: { content?: string; type: MessageType }) => {
      if (editingMessage) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === editingMessage._id
              ? { ...m, content: message.content, isEdited: true, updatedAt: new Date().toISOString() }
              : m
          )
        )
        setEditingMessage(null)
      } else {
        const newMessage: Message = {
          _id: Date.now().toString(),
          chatId: id || '1',
          senderId: 'user1',
          content: message.content,
          type: message.type,
          isLocked: false,
          isEdited: false,
          isDeleted: false,
          task: { isTask: false, isCompleted: false },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setMessages((prev) => [newMessage, ...prev])
      }
    },
    [id, editingMessage]
  )

  const handleMessageLongPress = useCallback((message: Message) => {
    const actions = [
      {
        text: 'Edit',
        onPress: () => setEditingMessage(message),
      },
      {
        text: message.isLocked ? 'Unlock' : 'Lock',
        onPress: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === message._id ? { ...m, isLocked: !m.isLocked } : m
            )
          )
        },
      },
      {
        text: message.task.isTask ? 'Remove Task' : 'Make Task',
        onPress: () => {
          if (message.task.isTask) {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === message._id
                  ? { ...m, task: { isTask: false, isCompleted: false } }
                  : m
              )
            )
          } else {
            Alert.alert('Set Reminder', 'Choose when to be reminded', [
              {
                text: 'Today',
                onPress: () => {
                  const today = new Date()
                  today.setHours(18, 0, 0, 0)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m._id === message._id
                        ? { ...m, task: { isTask: true, isCompleted: false, reminderAt: today.toISOString() } }
                        : m
                    )
                  )
                },
              },
              {
                text: 'Tomorrow',
                onPress: () => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  tomorrow.setHours(9, 0, 0, 0)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m._id === message._id
                        ? { ...m, task: { isTask: true, isCompleted: false, reminderAt: tomorrow.toISOString() } }
                        : m
                    )
                  )
                },
              },
              {
                text: 'Next Week',
                onPress: () => {
                  const nextWeek = new Date()
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  nextWeek.setHours(9, 0, 0, 0)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m._id === message._id
                        ? { ...m, task: { isTask: true, isCompleted: false, reminderAt: nextWeek.toISOString() } }
                        : m
                    )
                  )
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        },
      },
      {
        text: 'Copy Text',
        onPress: () => console.log('Copy:', message.content),
      },
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => {
          if (message.isLocked) {
            Alert.alert('Cannot Delete', 'This message is locked. Unlock it first to delete.')
          } else {
            Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  setMessages((prev) => prev.filter((m) => m._id !== message._id))
                },
              },
            ])
          }
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]

    Alert.alert('Message Options', undefined, actions)
  }, [])

  const handleTaskToggle = useCallback((message: Message) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === message._id
          ? {
              ...m,
              task: {
                ...m.task,
                isCompleted: !m.task.isCompleted,
                completedAt: !m.task.isCompleted ? new Date().toISOString() : undefined,
              },
            }
          : m
      )
    )
  }, [])

  const handleAttachmentSelect = useCallback((type: string) => {
    console.log('Selected attachment:', type)
  }, [])

  
  const handleVoiceStart = useCallback(() => {
    console.log('Start voice recording')
  }, [])

  const handleVoiceEnd = useCallback((uri: string) => {
    console.log('End voice recording:', uri)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null)
  }, [])

  return (
    <YStack flex={1} backgroundColor="$background" paddingBottom={insets.bottom}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="translate-with-padding">
        <ChatHeader
          chat={chat}
          onBack={handleBack}
          onChatPress={handleChatPress}
          onSearch={handleSearch}
          onTasks={handleTasks}
          onMenu={handleMenu}
          taskCount={taskCount}
        />

        <MessageList
          messages={messages}
          onLoadMore={handleLoadMore}
          isLoading={isLoading}
          chatId={id || '1'}
          onMessageLongPress={handleMessageLongPress}
          onTaskToggle={handleTaskToggle}
        />

        <MessageInput
          onSend={handleSend}
          onAttachmentSelect={handleAttachmentSelect}
          onVoiceStart={handleVoiceStart}
          onVoiceEnd={handleVoiceEnd}
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
        />
      </KeyboardAvoidingView>
    </YStack>
  )
}
