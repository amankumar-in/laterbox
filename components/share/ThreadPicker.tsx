import { useState, useCallback } from 'react'
import { FlatList, TextInput, Pressable } from 'react-native'
import { XStack, YStack, Text } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useThreads, useCreateThread } from '../../hooks/useThreads'
import type { ThreadWithLastNote } from '../../services/database/types'

interface ThreadPickerProps {
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
}

export function ThreadPicker({ selectedThreadId, onSelectThread }: ThreadPickerProps) {
  const { iconColor, accentColor, color, placeholderColor } = useThemeColor()
  const [search, setSearch] = useState('')
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThreadName, setNewThreadName] = useState('')

  const { data: threadsData } = useThreads({ search: search || undefined })
  const createThread = useCreateThread()

  const threads = threadsData?.data ?? []

  // Sort: pinned first, then by lastNote timestamp
  const sortedThreads = [...threads]
    .filter((t) => !t.isSystemThread)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      const aTime = a.lastNote?.timestamp ?? a.createdAt
      const bTime = b.lastNote?.timestamp ?? b.createdAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  const handleCreateThread = useCallback(async () => {
    const name = newThreadName.trim()
    if (!name) return
    const thread = await createThread.mutateAsync({ name })
    onSelectThread(thread.id)
    setNewThreadName('')
    setShowNewThread(false)
  }, [newThreadName, createThread, onSelectThread])

  const renderThread = ({ item }: { item: ThreadWithLastNote }) => {
    const selected = selectedThreadId === item.id
    return (
      <Pressable onPress={() => onSelectThread(item.id)}>
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$2.5"
          alignItems="center"
          gap="$3"
          backgroundColor={selected ? '$backgroundStrong' : 'transparent'}
          borderWidth={selected ? 1 : 0}
          borderColor={selected ? '$accentColor' : 'transparent'}
          borderRadius="$3"
        >
          <Text fontSize={20}>{item.icon || '📝'}</Text>
          <YStack flex={1}>
            <Text fontSize="$3" fontWeight="500" color="$color" numberOfLines={1}>
              {item.name}
            </Text>
            {item.lastNote && (
              <Text fontSize="$2" color="$colorSubtle" numberOfLines={1}>
                {item.lastNote.content}
              </Text>
            )}
          </YStack>
          {item.isPinned && (
            <Ionicons name="pin" size={14} color={iconColor} />
          )}
          {selected && (
            <Ionicons name="checkmark-circle" size={20} color={accentColor} />
          )}
        </XStack>
      </Pressable>
    )
  }

  return (
    <YStack flex={1} gap="$2">
      <XStack paddingHorizontal="$1" gap="$2" alignItems="center">
        <XStack
          flex={1}
          backgroundColor="$backgroundStrong"
          borderRadius="$3"
          paddingHorizontal="$3"
          height={40}
          alignItems="center"
          gap="$2"
        >
          <Ionicons name="search" size={16} color={iconColor} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color }}
            placeholder="Search threads..."
            placeholderTextColor={placeholderColor}
            value={search}
            onChangeText={setSearch}
          />
        </XStack>
        <Pressable onPress={() => setShowNewThread(!showNewThread)}>
          <XStack
            width={40}
            height={40}
            borderRadius="$3"
            backgroundColor="$accentColor"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name={showNewThread ? 'close' : 'add'} size={20} color="#fff" />
          </XStack>
        </Pressable>
      </XStack>

      {showNewThread && (
        <XStack paddingHorizontal="$1" gap="$2" alignItems="center">
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              color,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: accentColor,
              borderRadius: 8,
              paddingHorizontal: 12,
              height: 40,
            }}
            placeholder="New thread name..."
            placeholderTextColor={placeholderColor}
            value={newThreadName}
            onChangeText={setNewThreadName}
            onSubmitEditing={handleCreateThread}
            autoFocus
          />
          <Pressable onPress={handleCreateThread}>
            <XStack
              width={40}
              height={40}
              borderRadius="$3"
              backgroundColor="$accentColor"
              alignItems="center"
              justifyContent="center"
              opacity={newThreadName.trim() ? 1 : 0.5}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </XStack>
          </Pressable>
        </XStack>
      )}

      <FlatList
        data={sortedThreads}
        renderItem={renderThread}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </YStack>
  )
}
