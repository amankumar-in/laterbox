import { useCallback, useRef } from 'react'
import { FlatList, ActivityIndicator } from 'react-native'
import { YStack, Text } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'
import { NoteBubble } from './NoteBubble'
import { DateSeparator } from './DateSeparator'
import type { Message } from '../../types'

interface MessageListProps {
  messages: Message[]
  onLoadMore: () => void
  isLoading: boolean
  chatId: string
  onMessageLongPress: (message: Message) => void
  onTaskToggle: (message: Message) => void
}

type ListItem =
  | { type: 'message'; data: Message }
  | { type: 'date'; date: Date; id: string }

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function processMessages(messages: Message[]): ListItem[] {
  const items: ListItem[] = []
  let lastDate: Date | null = null

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  for (const message of sortedMessages) {
    const messageDate = new Date(message.createdAt)

    if (!lastDate || !isSameDay(lastDate, messageDate)) {
      items.push({
        type: 'date',
        date: messageDate,
        id: `date-${messageDate.toDateString()}`,
      })
      lastDate = messageDate
    }

    items.push({ type: 'message', data: message })
  }

  return items
}

export function MessageList({
  messages,
  onLoadMore,
  isLoading,
  chatId,
  onMessageLongPress,
  onTaskToggle,
}: MessageListProps) {
  const { iconColor } = useThemeColor()
  const flatListRef = useRef<FlatList>(null)
  const items = processMessages(messages)

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'date') {
        return <DateSeparator date={item.date} />
      }
      return (
        <NoteBubble
          message={item.data}
          onLongPress={onMessageLongPress}
          onTaskToggle={onTaskToggle}
        />
      )
    },
    [onMessageLongPress, onTaskToggle]
  )

  const keyExtractor = useCallback((item: ListItem) => {
    return item.type === 'date' ? item.id : item.data._id
  }, [])

  const handleEndReached = useCallback(() => {
    if (!isLoading) {
      onLoadMore()
    }
  }, [isLoading, onLoadMore])

  const renderFooter = useCallback(() => {
    if (!isLoading) return null
    return (
      <YStack padding="$4" alignItems="center">
        <ActivityIndicator />
      </YStack>
    )
  }, [isLoading])

  const renderEmpty = useCallback(() => {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
        <Ionicons name="chatbubble-outline" size={64} color={iconColor} />
        <Text fontSize="$5" color="$colorSubtle" marginTop="$4" textAlign="center">
          No messages yet
        </Text>
        <Text fontSize="$3" color="$colorMuted" marginTop="$2" textAlign="center">
          Start capturing your thoughts
        </Text>
      </YStack>
    )
  }, [iconColor])

  return (
    <YStack flex={1}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      />
    </YStack>
  )
}
