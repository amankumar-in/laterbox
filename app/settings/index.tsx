import { useState, useCallback } from 'react'
import { ScrollView, Alert, Image, Switch } from 'react-native'
import { YStack, XStack, Text, Button, Separator } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useUser } from '../../hooks/useUser'

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

interface SettingsToggleItemProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  title: string
  subtitle?: string
  value: boolean
  onValueChange: (value: boolean) => void
  trackColor: string
}

function SettingsToggleItem({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onValueChange,
  trackColor,
}: SettingsToggleItemProps) {
  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      gap="$3"
      alignItems="center"
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
        <Text fontSize="$4" color="$color">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="$2" color="$colorSubtle">
            {subtitle}
          </Text>
        )}
      </YStack>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: trackColor }}
        thumbColor="white"
      />
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
  const { iconColorStrong, iconColor, brandText, accentColor, successColor, warningColor, infoColor, errorColor } = useThemeColor()
  const { data: user } = useUser()
  const [dataSyncEnabled, setDataSyncEnabled] = useState(true)

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

  const handleHelp = useCallback(() => {
    console.log('Help')
  }, [])

  const handleAbout = useCallback(() => {
    Alert.alert(
      'About Mneme',
      'Version 1.0.0\n\nA personal note-taking app using familiar instant messaging UI.\n\nBuilt with Expo and Tamagui.'
    )
  }, [])

  const handleDeleteRemoteData = useCallback(() => {
    Alert.alert(
      'Delete Remote Data',
      'This will permanently delete all threads, tasks, and notes stored online. Local data will remain. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => console.log('Remote data deleted'),
        },
      ]
    )
  }, [])

  const handleDeleteAccountInfo = useCallback(() => {
    Alert.alert(
      'Delete Account Information',
      'This will remove your name, email, phone, and username. Your app will continue to work locally.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => console.log('Account info deleted'),
        },
      ]
    )
  }, [])

  const handleDeleteMedia = useCallback(() => {
    Alert.alert(
      'Delete All Media',
      'This will delete all photos, videos, and files stored locally. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => console.log('Media deleted'),
        },
      ]
    )
  }, [])

  const handleDeleteEverything = useCallback(() => {
    Alert.alert(
      'Delete Everything',
      'This will delete all remote data, local data, settings, and reset the app as if started for the first time. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => console.log('Everything deleted'),
        },
      ]
    )
  }, [])

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingTop={insets.top + 8}
        paddingHorizontal="$4"
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
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={{ width: 60, height: 60, borderRadius: 30 }}
            />
          ) : (
            <XStack
              width={60}
              height={60}
              borderRadius={30}
              backgroundColor="$brandBackground"
              alignItems="center"
              justifyContent="center"
            >
              <Text color={brandText} fontSize="$6" fontWeight="600">
                {(user?.name || 'Me').slice(0, 2).toUpperCase()}
              </Text>
            </XStack>
          )}

          <YStack flex={1}>
            <Text fontSize="$5" fontWeight="600" color="$color">
              {user?.name || 'Me'}
            </Text>
            <Text fontSize="$3" color="$colorSubtle">
              {user?.username ? `@${user.username}` : 'Username not set'}
            </Text>
          </YStack>

          <XStack backgroundColor="$backgroundStrong" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
            <Text fontSize="$2" color="$colorSubtle">View Profile</Text>
          </XStack>
        </XStack>

        <Separator />

        <SettingsItem
          icon="lock-closed-outline"
          iconColor={successColor}
          title="Privacy"
          subtitle="Who can find you"
          onPress={handlePrivacy}
        />
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

        <SectionHeader title="Data Control" />
        <SettingsToggleItem
          icon="sync-outline"
          iconColor={accentColor}
          title="Data Sync"
          subtitle={dataSyncEnabled ? 'Syncing to cloud backup' : 'Fully offline mode'}
          value={dataSyncEnabled}
          onValueChange={setDataSyncEnabled}
          trackColor={accentColor}
        />
        <SettingsItem
          icon="cloud-offline-outline"
          iconColor={warningColor}
          title="Delete Remote Data"
          subtitle="Remove all threads, tasks, and notes from cloud"
          onPress={handleDeleteRemoteData}
          showArrow={false}
        />
        <SettingsItem
          icon="person-remove-outline"
          iconColor={warningColor}
          title="Delete Account Information"
          subtitle="Remove name, email, phone, username"
          onPress={handleDeleteAccountInfo}
          showArrow={false}
        />
        <SettingsItem
          icon="images-outline"
          iconColor={warningColor}
          title="Delete All Media"
          subtitle="Remove all locally stored photos and files"
          onPress={handleDeleteMedia}
          showArrow={false}
        />
        <SettingsItem
          icon="nuclear-outline"
          iconColor=""
          title="Delete Everything"
          subtitle="Reset app to factory state"
          onPress={handleDeleteEverything}
          showArrow={false}
          danger
        />

        <YStack height={insets.bottom + 20} />
      </ScrollView>
    </YStack>
  )
}
