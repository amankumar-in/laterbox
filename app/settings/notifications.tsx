import { useState, useCallback } from 'react'
import { YStack, XStack, Text, Button, Switch } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'

interface ToggleSettingProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  title: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
}

function ToggleSetting({
  icon,
  iconColor,
  title,
  description,
  value,
  onValueChange,
}: ToggleSettingProps) {
  const { brandText } = useThemeColor()

  return (
    <XStack
      paddingVertical="$3"
      paddingHorizontal="$4"
      gap="$3"
      alignItems="flex-start"
    >
      <XStack
        width={36}
        height={36}
        borderRadius="$2"
        backgroundColor="$backgroundStrong"
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </XStack>

      <YStack flex={1}>
        <Text fontSize="$4" fontWeight="500" color="$color">
          {title}
        </Text>
        <Text fontSize="$3" color="$colorSubtle" marginTop="$1">
          {description}
        </Text>
      </YStack>

      <Switch
        size="$3"
        checked={value}
        onCheckedChange={onValueChange}
        backgroundColor={value ? '$brandBackground' : '$borderColor'}
      >
        <Switch.Thumb backgroundColor={brandText} />
      </Switch>
    </XStack>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { iconColorStrong, iconColor, warningColor, accentColor } = useThemeColor()
  const [taskReminders, setTaskReminders] = useState(true)
  const [sharedMessages, setSharedMessages] = useState(false)

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

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
          Notifications
        </Text>
      </XStack>

      <YStack paddingTop="$4">
        <ToggleSetting
          icon="alarm"
          iconColor={warningColor}
          title="Task Reminders"
          description="Get notified when a task reminder is due"
          value={taskReminders}
          onValueChange={setTaskReminders}
        />

        <ToggleSetting
          icon="chatbubbles"
          iconColor={accentColor}
          title="Shared Chat Messages"
          description="Get notified when someone sends a message in a shared chat"
          value={sharedMessages}
          onValueChange={setSharedMessages}
        />
      </YStack>

      <YStack paddingHorizontal="$4" marginTop="$6">
        <YStack
          backgroundColor="$backgroundStrong"
          padding="$3"
          borderRadius="$3"
        >
          <XStack alignItems="flex-start" gap="$2">
            <Ionicons name="notifications" size={20} color={iconColor} />
            <YStack flex={1}>
              <Text fontSize="$3" fontWeight="500" color="$color">
                Permission Required
              </Text>
              <Text fontSize="$2" color="$colorSubtle" marginTop="$1">
                Notifications require system permission. If notifications aren't working,
                check your device settings.
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
