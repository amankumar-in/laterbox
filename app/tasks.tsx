import { useState, useCallback, useMemo } from 'react'
import { FlatList } from 'react-native'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../hooks/useThemeColor'
import type { Message } from '../types'

type TaskFilter = 'pending' | 'completed' | 'all'

const MOCK_TASKS: Message[] = [
  {
    _id: '1',
    chatId: '1',
    senderId: 'user1',
    content: 'Implement voice notes with waveform visualization',
    type: 'text',
    isLocked: false,
    isEdited: false,
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
    _id: '2',
    chatId: '2',
    senderId: 'user1',
    content: 'Buy groceries: milk, eggs, bread',
    type: 'text',
    isLocked: false,
    isEdited: false,
    isDeleted: false,
    task: {
      isTask: true,
      isCompleted: false,
      reminderAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    _id: '3',
    chatId: '1',
    senderId: 'user1',
    content: 'Remember to add dark mode support',
    type: 'text',
    isLocked: false,
    isEdited: false,
    isDeleted: false,
    task: {
      isTask: true,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const CHAT_NAMES: Record<string, string> = {
  '1': 'Ideas',
  '2': 'Shopping List',
}

interface TaskItemProps {
  task: Message
  chatName: string
  onToggle: () => void
  onPress: () => void
}

function TaskItem({ task, chatName, onToggle, onPress }: TaskItemProps) {
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
          <Text fontSize="$2" color="$colorSubtle">
            {chatName}
          </Text>

          {task.task.reminderAt && (
            <>
              <Text fontSize="$2" color="$colorSubtle">
                •
              </Text>
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
  const insets = useSafeAreaInsets()
  const { iconColorStrong, iconColor } = useThemeColor()
  const [tasks, setTasks] = useState<Message[]>(MOCK_TASKS)
  const [filter, setFilter] = useState<TaskFilter>('pending')

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'pending':
        return tasks.filter((t) => !t.task.isCompleted)
      case 'completed':
        return tasks.filter((t) => t.task.isCompleted)
      default:
        return tasks
    }
  }, [tasks, filter])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleToggle = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? {
              ...t,
              task: {
                ...t.task,
                isCompleted: !t.task.isCompleted,
                completedAt: !t.task.isCompleted ? new Date().toISOString() : undefined,
              },
            }
          : t
      )
    )
  }, [])

  const handleTaskPress = useCallback(
    (task: Message) => {
      router.push(`/chat/${task.chatId}`)
    },
    [router]
  )

  const renderFilterButton = (key: TaskFilter, label: string) => {
    const isSelected = filter === key
    return (
      <Button
        key={key}
        size="$3"
        borderRadius="$10"
        backgroundColor={isSelected ? '$brandBackground' : 'transparent'}
        borderWidth={1}
        borderColor={isSelected ? '$brandBackground' : '$borderColor'}
        color={isSelected ? '$brandText' : '$colorSubtle'}
        pressStyle={{ backgroundColor: isSelected ? '$brandBackgroundHover' : '$backgroundHover' }}
        onPress={() => setFilter(key)}
      >
        {label}
      </Button>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingTop={insets.top}
        paddingHorizontal="$2"
        paddingBottom="$2"
        backgroundColor="$background"
        alignItems="center"
        gap="$2"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Button
          size="$3"
          circular
          chromeless
          onPress={handleBack}
          icon={<Ionicons name="arrow-back" size={24} color={iconColorStrong} />}
        />
        <Text fontSize="$6" fontWeight="700" flex={1} color="$color">
          Tasks
        </Text>
      </XStack>

      <XStack paddingHorizontal="$4" paddingVertical="$2" gap="$2">
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('completed', 'Completed')}
        {renderFilterButton('all', 'All')}
      </XStack>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            chatName={CHAT_NAMES[item.chatId] || 'Unknown'}
            onToggle={() => handleToggle(item._id)}
            onPress={() => handleTaskPress(item)}
          />
        )}
        ListEmptyComponent={
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
            <Ionicons name="checkbox-outline" size={64} color={iconColor} />
            <Text fontSize="$5" color="$colorSubtle" marginTop="$4" textAlign="center">
              No tasks
            </Text>
            <Text fontSize="$3" color="$colorMuted" marginTop="$2" textAlign="center">
              {filter === 'pending'
                ? 'Create a task by long-pressing a message'
                : filter === 'completed'
                ? 'Completed tasks will appear here'
                : 'No tasks yet'}
            </Text>
          </YStack>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </YStack>
  )
}
