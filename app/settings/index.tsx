import { useCallback } from 'react'
import { ScrollView, Alert } from 'react-native'
import { YStack, XStack, Text, Button, Separator } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  title: string
  subtitle?: string
  onPress: () => void
  showArrow?: boolean
  danger?: boolean
}

function SettingsItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}: SettingsItemProps) {
  const { iconColor: defaultIconColor, errorColor } = useThemeColor()

  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      gap="$3"
      alignItems="center"
      pressStyle={{ backgroundColor: '$backgroundHover' }}
      onPress={onPress}
    >
      <XStack
        width={36}
        height={36}
        borderRadius="$2"
        backgroundColor={danger ? '$red3' : '$backgroundStrong'}
        alignItems="center"
        justifyContent="center"
      >
        <Ionicons name={icon} size={20} color={danger ? errorColor : iconColor} />
      </XStack>

      <YStack flex={1}>
        <Text fontSize="$4" color={danger ? '$errorColor' : '$color'}>
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="$2" color="$colorSubtle">
            {subtitle}
          </Text>
        )}
      </YStack>

      {showArrow && <Ionicons name="chevron-forward" size={20} color={defaultIconColor} />}
    </XStack>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      fontSize="$2"
      fontWeight="600"
      color="$colorSubtle"
      paddingHorizontal="$4"
      paddingTop="$4"
      paddingBottom="$2"
      textTransform="uppercase"
    >
      {title}
    </Text>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { iconColorStrong, iconColor, brandText, accentColor, successColor, warningColor, infoColor } = useThemeColor()

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleProfile = useCallback(() => {
    router.push('/settings/profile')
  }, [router])

  const handlePrivacy = useCallback(() => {
    router.push('/settings/privacy')
  }, [router])

  const handleNotifications = useCallback(() => {
    router.push('/settings/notifications')
  }, [router])

  const handleTheme = useCallback(() => {
    Alert.alert('Theme', 'Choose a theme', [
      { text: 'Light', onPress: () => console.log('Light') },
      { text: 'Dark', onPress: () => console.log('Dark') },
      { text: 'System (Default)', onPress: () => console.log('System') },
      { text: 'Cancel', style: 'cancel' },
    ])
  }, [])

  const handleStorage = useCallback(() => {
    console.log('Storage & Data')
  }, [])

  const handleHelp = useCallback(() => {
    console.log('Help')
  }, [])

  const handleAbout = useCallback(() => {
    Alert.alert(
      'About Mneme',
      'Version 1.0.0\n\nA personal note-taking app using familiar instant messaging UI.\n\nBuilt with Expo and Tamagui.'
    )
  }, [])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete all your notes, tasks, and data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Delete',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: () => console.log('Account deleted'),
                },
              ]
            )
          },
        },
      ]
    )
  }, [])

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
          Settings
        </Text>
      </XStack>

      <ScrollView>
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$4"
          gap="$3"
          alignItems="center"
          pressStyle={{ backgroundColor: '$backgroundHover' }}
          onPress={handleProfile}
        >
          <XStack
            width={60}
            height={60}
            borderRadius={30}
            backgroundColor="$brandBackground"
            alignItems="center"
            justifyContent="center"
          >
            <Text color={brandText} fontSize="$6" fontWeight="600">
              ME
            </Text>
          </XStack>

          <YStack flex={1}>
            <Text fontSize="$5" fontWeight="600" color="$color">
              Me
            </Text>
            <Text fontSize="$3" color="$colorSubtle">
              Tap to edit profile
            </Text>
          </YStack>

          <Ionicons name="chevron-forward" size={20} color={iconColor} />
        </XStack>

        <Separator />

        <SectionHeader title="Account" />
        <SettingsItem
          icon="person-outline"
          iconColor={accentColor}
          title="Edit Profile"
          subtitle="Name, username, email"
          onPress={handleProfile}
        />
        <SettingsItem
          icon="lock-closed-outline"
          iconColor={successColor}
          title="Privacy"
          subtitle="Who can find you"
          onPress={handlePrivacy}
        />

        <SectionHeader title="App" />
        <SettingsItem
          icon="notifications-outline"
          iconColor={warningColor}
          title="Notifications"
          subtitle="Task reminders, shared messages"
          onPress={handleNotifications}
        />
        <SettingsItem
          icon="color-palette-outline"
          iconColor="#8b5cf6"
          title="Theme"
          subtitle="System"
          onPress={handleTheme}
        />
        <SettingsItem
          icon="server-outline"
          iconColor={infoColor}
          title="Storage & Data"
          onPress={handleStorage}
        />

        <SectionHeader title="About" />
        <SettingsItem
          icon="help-circle-outline"
          iconColor="#6366f1"
          title="Help"
          onPress={handleHelp}
        />
        <SettingsItem
          icon="information-circle-outline"
          iconColor={iconColor}
          title="About Mneme"
          onPress={handleAbout}
        />

        <SectionHeader title="Danger Zone" />
        <SettingsItem
          icon="trash-outline"
          iconColor=""
          title="Delete Account"
          subtitle="Permanently delete all data"
          onPress={handleDeleteAccount}
          showArrow={false}
          danger
        />

        <YStack height={insets.bottom + 20} />
      </ScrollView>
    </YStack>
  )
}
