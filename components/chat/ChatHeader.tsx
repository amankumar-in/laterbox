import { useState } from 'react'
import { XStack, YStack, Text, Button, Popover } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'
import type { Chat } from '../../types'

interface ChatHeaderProps {
  chat: Chat
  onBack: () => void
  onChatPress: () => void
  onSearch: () => void
  onTasks: () => void
  onMenu: () => void
  taskCount?: number
}

const menuOptions = [
  { id: 'media', icon: 'images', label: 'Media Files' },
  { id: 'wallpaper', icon: 'color-palette', label: 'Chat Wallpaper' },
  { id: 'shortcut', icon: 'add-circle', label: 'Add Shortcut' },
  { id: 'export', icon: 'download', label: 'Export Chat' },
  { id: 'share', icon: 'share', label: 'Share' },
] as const

export function ChatHeader({
  chat,
  onBack,
  onChatPress,
  onSearch,
  onTasks,
  onMenu,
  taskCount = 0,
}: ChatHeaderProps) {
  const insets = useSafeAreaInsets()
  const { iconColorStrong, brandText, iconColor } = useThemeColor()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleMenuSelect = (id: string) => {
    setMenuOpen(false)
    console.log('Menu selected:', id, chat._id)
    onMenu()
  }

  return (
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
        onPress={onBack}
        icon={<Ionicons name="arrow-back" size={24} color={iconColorStrong} />}
      />

      <XStack
        flex={1}
        alignItems="center"
        gap="$2"
        onPress={onChatPress}
        pressStyle={{ opacity: 0.7 }}
      >
        {chat.icon ? (
          <Text fontSize="$5">{chat.icon}</Text>
        ) : (
          <XStack
            width={36}
            height={36}
            borderRadius={18}
            backgroundColor="$brandBackground"
            alignItems="center"
            justifyContent="center"
          >
            <Text color={brandText} fontWeight="600" fontSize="$3">
              {chat.name.slice(0, 2).toUpperCase()}
            </Text>
          </XStack>
        )}
        <Text fontSize="$5" fontWeight="600" numberOfLines={1} flex={1} color="$color">
          {chat.name}
        </Text>
      </XStack>

      <Button
        size="$3"
        circular
        chromeless
        onPress={onSearch}
        icon={<Ionicons name="search" size={22} color={iconColorStrong} />}
      />

      <XStack position="relative">
        <Button
          size="$3"
          circular
          chromeless
          onPress={onTasks}
          icon={<Ionicons name="checkbox-outline" size={22} color={iconColorStrong} />}
        />
        {taskCount > 0 && (
          <XStack
            position="absolute"
            top={6}
            right={6}
            backgroundColor="$errorColor"
            borderRadius={7}
            minWidth={14}
            height={14}
            alignItems="center"
            justifyContent="center"
            onPress={onTasks}
          >
            <Text color={brandText} fontSize={9} fontWeight="700">
              {taskCount > 99 ? '99+' : taskCount}
            </Text>
          </XStack>
        )}
      </XStack>

      <Popover open={menuOpen} onOpenChange={setMenuOpen} placement="bottom-end">
        <Popover.Trigger asChild>
          <Button
            size="$3"
            circular
            chromeless
            icon={<Ionicons name="ellipsis-vertical" size={22} color={iconColorStrong} />}
          />
        </Popover.Trigger>
        <Popover.Content
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$3"
          padding="$1"
          elevation={4}
          enterStyle={{ opacity: 0, y: -10 }}
          exitStyle={{ opacity: 0, y: -10 }}
          animation="quick"
          right={0}
        >
          <YStack>
            {menuOptions.map((option) => (
              <XStack
                key={option.id}
                paddingHorizontal="$3"
                paddingVertical="$2.5"
                gap="$3"
                alignItems="center"
                pressStyle={{ backgroundColor: '$backgroundStrong' }}
                borderRadius="$2"
                onPress={() => handleMenuSelect(option.id)}
              >
                <Ionicons name={option.icon as any} size={20} color={iconColor} />
                <Text fontSize="$3" color="$color">{option.label}</Text>
              </XStack>
            ))}
          </YStack>
        </Popover.Content>
      </Popover>
    </XStack>
  )
}
