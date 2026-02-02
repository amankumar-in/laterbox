import { useState, useCallback } from 'react'
import { ScrollView, Alert } from 'react-native'
import { YStack, XStack, Text, Button, Input } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'

interface InputFieldProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  optional?: boolean
  helperText?: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  optional = false,
  helperText,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputFieldProps) {
  return (
    <YStack gap="$1" marginBottom="$4">
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$3" fontWeight="500" color="$color">
          {label}
        </Text>
        {optional && (
          <Text fontSize="$2" color="$colorMuted">
            (optional)
          </Text>
        )}
      </XStack>
      <Input
        size="$4"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$3"
        backgroundColor="$background"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="$colorMuted"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {helperText && (
        <Text fontSize="$2" color="$colorSubtle">
          {helperText}
        </Text>
      )}
    </YStack>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { iconColorStrong, iconColor, brandText, accentColor } = useThemeColor()

  const [name, setName] = useState('Me')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleChangeAvatar = useCallback(() => {
    Alert.alert('Change Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => console.log('Camera') },
      { text: 'Choose from Library', onPress: () => console.log('Library') },
      { text: 'Remove Photo', onPress: () => console.log('Remove'), style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ])
  }, [])

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      Alert.alert('Saved', 'Your profile has been updated')
    }, 1000)
  }, [])

  const hasChanges = name !== 'Me' || username || email || phone

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
          Edit Profile
        </Text>
        <Button
          size="$3"
          chromeless
          disabled={!hasChanges || isSaving}
          onPress={handleSave}
        >
          <Text color={hasChanges ? '$accentColor' : '$colorMuted'} fontWeight="600">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Button>
      </XStack>

      <ScrollView>
        <YStack alignItems="center" paddingVertical="$6">
          <XStack position="relative">
            <XStack
              width={100}
              height={100}
              borderRadius={50}
              backgroundColor="$brandBackground"
              alignItems="center"
              justifyContent="center"
            >
              <Text color={brandText} fontSize="$8" fontWeight="600">
                {name.slice(0, 2).toUpperCase()}
              </Text>
            </XStack>
            <Button
              size="$3"
              circular
              position="absolute"
              bottom={0}
              right={0}
              backgroundColor="$backgroundStrong"
              borderWidth={3}
              borderColor="$background"
              onPress={handleChangeAvatar}
              icon={<Ionicons name="camera" size={18} color={iconColor} />}
            />
          </XStack>
        </YStack>

        <YStack paddingHorizontal="$4">
          <InputField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />

          <InputField
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            optional
            helperText="Others can find you by your username"
            autoCapitalize="none"
          />

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            optional
            helperText="Used for sharing chats via email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 234 567 8900"
            optional
            helperText="Used for sharing chats via phone number"
            keyboardType="phone-pad"
          />

          <YStack
            backgroundColor="$blue2"
            padding="$3"
            borderRadius="$3"
            marginTop="$4"
          >
            <XStack alignItems="flex-start" gap="$2">
              <Ionicons name="information-circle" size={20} color={accentColor} />
              <YStack flex={1}>
                <Text fontSize="$3" fontWeight="500" color="$blue11">
                  Why add profile info?
                </Text>
                <Text fontSize="$2" color="$blue10" marginTop="$1">
                  Username, email, and phone are optional but needed if you want to share
                  chats with others. Other users can find and share notes with you using
                  these identifiers.
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </YStack>

        <YStack height={insets.bottom + 20} />
      </ScrollView>
    </YStack>
  )
}
