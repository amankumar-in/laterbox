import { useState, useCallback, useMemo } from 'react'
import { FlatList, ActivityIndicator } from 'react-native'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SearchBar } from '../components/SearchBar'
import { FilterChips } from '../components/FilterChips'
import { useThemeColor } from '../hooks/useThemeColor'
import { useTasks } from '../hooks/useTasks'
import { completeTask, setMessageTask } from '../services/api'
import type { Message } from '../types'

type TaskFilter = 'pending' | 'completed' | 'all'

const FILTER_OPTIONS = [
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
]

interface TaskItemProps {
  task: Message
  onToggle: () => void
  onPress: () => void
  showChatName?: boolean
}

function TaskItem({ task, onToggle, onPress, showChatName = true }: TaskItemProps) {
  const { successColor, accentColor, errorColor, iconColor } = useThemeColor()
  const isOverdue = task.task.reminderAt && new Date(task.task.reminderAt) < new Date()

  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      gap="$3"
      alignItems="flex-start"
      pressStyle={{ backgroundColor: '$backgroundHover' }}
      onPress={onPress}
    >
      <Button
        size="$3"
        circular
        chromeless
        onPress={onToggle}
        icon={
          <Ionicons
            name={task.task.isCompleted ? 'checkbox' : 'square-outline'}
            size={24}
            color={task.task.isCompleted ? successColor : accentColor}
          />
        }
      />

      <YStack flex={1} gap="$1">
        <Text
          fontSize="$4"
          numberOfLines={2}
          textDecorationLine={task.task.isCompleted ? 'line-through' : 'none'}
          color={task.task.isCompleted ? '$colorMuted' : '$color'}
        >
          {task.content}
        </Text>

        <XStack alignItems="center" gap="$2">
          {showChatName && task.chatName && (
            <Text fontSize="$2" color="$colorSubtle">
              {task.chatName}
            </Text>
          )}

          {task.task.reminderAt && (
            <>
              {showChatName && task.chatName && (
                <Text fontSize="$2" color="$colorSubtle">
                  •
                </Text>
              )}
              <XStack alignItems="center" gap="$1">
                <Ionicons
                  name="alarm"
                  size={12}
                  color={isOverdue && !task.task.isCompleted ? errorColor : iconColor}
                />
                <Text
                  fontSize="$2"
                  color={isOverdue && !task.task.isCompleted ? '$errorColor' : '$colorSubtle'}
                >
                  {new Date(task.task.reminderAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </XStack>
            </>
          )}
        </XStack>
      </YStack>
    </XStack>
  )
}

export default function TasksScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ chatId?: string; chatName?: string }>()
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId
  const chatName = Array.isArray(params.chatName) ? params.chatName[0] : params.chatName
  const insets = useSafeAreaInsets()
  const { iconColor, iconColorStrong } = useThemeColor()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<TaskFilter>('pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch tasks from API
  const { data, isLoading, refetch } = useTasks({
    chatId: chatId || undefined,
    filter: filter === 'all' ? undefined : filter,
  })

  const tasks = data?.tasks ?? []

  // Mutation for completing tasks
  const completeMutation = useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: string }) =>
      completeTask(chatId, messageId),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
    },
  })

  // Mutation for uncompleting tasks
  const uncompleteMutation = useMutation({
    mutationFn: ({ chatId, messageId, reminderAt }: { chatId: string; messageId: string; reminderAt?: string }) =>
      setMessageTask(chatId, messageId, { isTask: true, reminderAt, isCompleted: false }),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
    },
  })

  // Apply search filter (client-side)
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const query = searchQuery.toLowerCase()
    return tasks.filter((t) => t.content?.toLowerCase().includes(query))
  }, [tasks, searchQuery])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleToggle = useCallback(
    (task: Message) => {
      if (!task.task.isCompleted) {
        completeMutation.mutate({ chatId: task.chatId, messageId: task._id })
      } else {
        uncompleteMutation.mutate({
          chatId: task.chatId,
          messageId: task._id,
          reminderAt: task.task.reminderAt,
        })
      }
    },
    [completeMutation, uncompleteMutation]
  )

  const handleTaskPress = useCallback(
    (task: Message) => {
      router.push(`/chat/${task.chatId}?messageId=${task._id}`)
    },
    [router]
  )

  // Get title - use chatName param for thread-specific view
  const title = chatId && chatName ? `${chatName} Tasks` : 'Tasks'

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingTop={insets.top + 8}
        paddingHorizontal="$4"
        paddingBottom="$2"
        backgroundColor="$background"
        alignItems="center"
        gap="$2"
      >
        <Button
          size="$3"
          circular
          chromeless
          onPress={handleBack}
          icon={<Ionicons name="arrow-back" size={24} color={iconColorStrong} />}
        />
        <Text fontSize="$6" fontWeight="600" flex={1} color="$color">
          {title}
        </Text>
      </XStack>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search tasks..."
      />

      <FilterChips
        options={FILTER_OPTIONS}
        selected={filter}
        onSelect={(key) => setFilter(key as TaskFilter)}
      />

      {isLoading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={iconColor} />
          <Text color="$colorSubtle" marginTop="$3">
            Loading tasks...
          </Text>
        </YStack>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggle={() => handleToggle(item)}
              onPress={() => handleTaskPress(item)}
              showChatName={!chatId}
            />
          )}
          ListEmptyComponent={
            <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
              <Ionicons name="checkbox-outline" size={64} color={iconColor} />
              <Text fontSize="$5" color="$colorSubtle" marginTop="$4" textAlign="center">
                No tasks
              </Text>
              <Text fontSize="$3" color="$colorMuted" marginTop="$2" textAlign="center">
                {searchQuery
                  ? `No tasks match "${searchQuery}"`
                  : filter === 'pending'
                  ? 'Create a task by long-pressing a message'
                  : filter === 'completed'
                  ? 'Completed tasks will appear here'
                  : 'No tasks yet'}
              </Text>
            </YStack>
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </YStack>
  )
}
