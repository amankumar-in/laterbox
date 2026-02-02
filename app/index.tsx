import { useState, useCallback } from 'react'
import { FlatList, Alert } from 'react-native'
import { YStack, Separator } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { FilterChips } from '../components/FilterChips'
import { NoteListItem } from '../components/NoteListItem'
import { FAB } from '../components/FAB'
import type { Chat, ChatFilter } from '../types'

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'tasks', label: 'Tasks' },
]

const MOCK_CHATS: Chat[] = [
  {
    _id: '1',
    name: 'Ideas',
    icon: '💡',
    ownerId: 'user1',
    participants: [],
    isShared: false,
    isPinned: true,
    lastMessage: {
      content: 'Build a note-taking app with chat UI',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    name: 'Shopping List',
    icon: '🛒',
    ownerId: 'user1',
    participants: [],
    isShared: false,
    isPinned: false,
    lastMessage: {
      content: 'Milk, eggs, bread, coffee',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '3',
    name: 'Work Notes',
    ownerId: 'user1',
    participants: [],
    isShared: false,
    isPinned: false,
    lastMessage: {
      content: 'Meeting at 3pm tomorrow',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '4',
    name: 'Travel Plans',
    icon: '✈️',
    ownerId: 'user1',
    participants: [],
    isShared: false,
    isPinned: false,
    lastMessage: {
      type: 'image',
      content: '',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ChatFilter>('all')
  const [chats] = useState<Chat[]>(MOCK_CHATS)

  const filteredChats = chats
    .filter((chat) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          chat.name.toLowerCase().includes(query) ||
          chat.lastMessage?.content?.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      const aTime = a.lastMessage?.timestamp || a.updatedAt
      const bTime = b.lastMessage?.timestamp || b.updatedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  const handleChatPress = useCallback(
    (chat: Chat) => {
      router.push(`/chat/${chat._id}`)
    },
    [router]
  )

  const handleChatLongPress = useCallback((chat: Chat) => {
    Alert.alert(chat.name, 'Choose an action', [
      {
        text: chat.isPinned ? 'Unpin' : 'Pin',
        onPress: () => console.log('Pin/Unpin:', chat._id),
      },
      {
        text: 'Export',
        onPress: () => console.log('Export:', chat._id),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Chat',
            'Are you sure? Locked messages will be preserved.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => console.log('Delete:', chat._id),
              },
            ]
          )
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }, [])

  const handleCreateChat = useCallback(() => {
    Alert.prompt('New Note', 'Enter a name for your note', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create',
        onPress: (name: string | undefined) => {
          if (name?.trim()) {
            console.log('Create chat:', name)
          }
        },
      },
    ])
  }, [])

  const handleQRPress = useCallback(() => {
    router.push('/qr-scan')
  }, [router])

  const handleSettingsPress = useCallback(() => {
    router.push('/settings')
  }, [router])

  return (
    <YStack flex={1} backgroundColor="$background">
      <Header
        title="Mneme"
        leftIcon={{ name: 'qr-code-outline', onPress: handleQRPress }}
        rightIcon={{ name: 'settings-outline', onPress: handleSettingsPress }}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search notes..."
      />

      <FilterChips
        options={FILTER_OPTIONS}
        selected={selectedFilter}
        onSelect={(key) => setSelectedFilter(key as ChatFilter)}
      />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NoteListItem
            chat={item}
            onPress={() => handleChatPress(item)}
            onLongPress={() => handleChatLongPress(item)}
          />
        )}
        ItemSeparatorComponent={() => <Separator marginLeft={76} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      />

      <FAB icon="add" onPress={handleCreateChat} />
    </YStack>
  )
}
