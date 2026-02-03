import { useState, useCallback, useEffect, useRef } from 'react'
import { ScrollView, Alert, Image } from 'react-native'
import { YStack, XStack, Text, Button, Input, Spinner } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useUser, useUpdateUser } from '../../hooks/useUser'
import { getDeviceId } from '../../services/storage'
import axios from 'axios'
import { Platform } from 'react-native'

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api'
  }
  return 'http://localhost:3000/api'
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || getApiUrl()

type VerificationState = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified'

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { iconColorStrong, iconColor, brandText, accentColor, placeholderColor, background, color, colorMuted, borderColor, successColor } = useThemeColor()

  const { data: user } = useUser()
  const updateUser = useUpdateUser()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [callingCode, setCallingCode] = useState('1')

  // Verification state
  const [emailVerifyState, setEmailVerifyState] = useState<VerificationState>('idle')
  const [emailCode, setEmailCode] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailResendTimer, setEmailResendTimer] = useState(0)

  const [phoneVerifyState, setPhoneVerifyState] = useState<VerificationState>('idle')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneResendTimer, setPhoneResendTimer] = useState(0)

  // Username state
  const [usernameError, setUsernameError] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  // Load user data
  useEffect(() => {
    if (user) {
      setName(user.name || 'Me')
      setAvatar(user.avatar || null)
      setUsername(user.username || '')
      setEmail(user.email || '')
      setNewEmail(user.email || '')
      if (user.phone) {
        const phoneMatch = user.phone.match(/^\+(\d{1,3})(\d+)$/)
        if (phoneMatch) {
          setCallingCode(phoneMatch[1])
          setPhone(phoneMatch[2])
          setNewPhone(phoneMatch[2])
        }
      }
    }
  }, [user])

  // Initialize edit state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setNewEmail(email)
      setNewPhone(phone)
      setEmailVerifyState(email ? 'verified' : 'idle')
      setPhoneVerifyState(phone ? 'verified' : 'idle')
    }
  }, [isEditing])

  // Email resend timer
  useEffect(() => {
    if (emailResendTimer > 0) {
      const timer = setTimeout(() => setEmailResendTimer(emailResendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [emailResendTimer])

  // Phone resend timer
  useEffect(() => {
    if (phoneResendTimer > 0) {
      const timer = setTimeout(() => setPhoneResendTimer(phoneResendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phoneResendTimer])

  // Username availability check
  useEffect(() => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current)
    }

    if (!username || username === user?.username) {
      setUsernameAvailable(null)
      setUsernameError('')
      return
    }

    const usernameRegex = /^[a-z0-9_]{3,30}$/
    if (!usernameRegex.test(username.toLowerCase())) {
      setUsernameError('3-30 chars, lowercase, numbers, underscores only')
      setUsernameAvailable(false)
      return
    }

    setCheckingUsername(true)
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const deviceId = await getDeviceId()
        const response = await axios.get(`${API_URL}/verify/check-username/${username}`, {
          headers: { 'X-Device-ID': deviceId },
        })
        setUsernameAvailable(response.data.available)
        setUsernameError(response.data.available ? '' : 'Username is taken')
      } catch (error: any) {
        setUsernameError(error.response?.data?.error || 'Failed to check')
        setUsernameAvailable(false)
      } finally {
        setCheckingUsername(false)
      }
    }, 500)
  }, [username, user?.username])

  const handleBack = useCallback(() => {
    if (isEditing) {
      // Reset to original values
      if (user) {
        setName(user.name || 'Me')
        setAvatar(user.avatar || null)
        setUsername(user.username || '')
        setEmail(user.email || '')
        setPhone(user.phone ? user.phone.replace(/^\+\d{1,3}/, '') : '')
      }
      setNewEmail('')
      setNewPhone('')
      setEmailVerifyState('idle')
      setPhoneVerifyState('idle')
      setEmailCode('')
      setPhoneCode('')
      setEmailError('')
      setPhoneError('')
      setIsEditing(false)
    } else {
      router.back()
    }
  }, [isEditing, user, router])

  const handleChangeAvatar = useCallback(async () => {
    Alert.alert('Change Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync()
          if (!permission.granted) {
            Alert.alert('Permission needed', 'Camera access is required to take photos')
            return
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
          if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri)
            setIsEditing(true)
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (!permission.granted) {
            Alert.alert('Permission needed', 'Photo library access is required')
            return
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
          if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri)
            setIsEditing(true)
          }
        },
      },
      {
        text: 'Remove Photo',
        onPress: () => {
          setAvatar(null)
          setIsEditing(true)
        },
        style: 'destructive',
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }, [])

  const handleSendEmailCode = useCallback(async () => {
    const targetEmail = newEmail || email
    if (!targetEmail) return

    setEmailVerifyState('sending')
    setEmailError('')

    try {
      const deviceId = await getDeviceId()
      await axios.post(
        `${API_URL}/verify/email/send`,
        { email: targetEmail },
        { headers: { 'X-Device-ID': deviceId } }
      )
      setEmailVerifyState('sent')
      setEmailResendTimer(30)
    } catch (error: any) {
      setEmailError(error.response?.data?.error || 'Failed to send code')
      setEmailVerifyState('idle')
    }
  }, [email, newEmail])

  const handleVerifyEmail = useCallback(async () => {
    if (!emailCode) return

    const targetEmail = newEmail || email
    setEmailVerifyState('verifying')
    setEmailError('')

    try {
      const deviceId = await getDeviceId()
      await axios.post(
        `${API_URL}/verify/email/verify`,
        { email: targetEmail, code: emailCode },
        { headers: { 'X-Device-ID': deviceId } }
      )
      setEmailVerifyState('verified')
      setEmail(targetEmail)
      setEmailCode('')
    } catch (error: any) {
      setEmailError(error.response?.data?.error || 'Verification failed')
      setEmailVerifyState('sent')
    }
  }, [email, newEmail, emailCode])

  const handleSendPhoneCode = useCallback(async () => {
    const targetPhone = newPhone || phone
    if (!targetPhone) return

    const fullPhone = `+${callingCode}${targetPhone}`
    setPhoneVerifyState('sending')
    setPhoneError('')

    try {
      const deviceId = await getDeviceId()
      await axios.post(
        `${API_URL}/verify/phone/send`,
        { phone: fullPhone },
        { headers: { 'X-Device-ID': deviceId } }
      )
      setPhoneVerifyState('sent')
      setPhoneResendTimer(30)
    } catch (error: any) {
      setPhoneError(error.response?.data?.error || 'Failed to send code')
      setPhoneVerifyState('idle')
    }
  }, [phone, newPhone, callingCode])

  const handleVerifyPhone = useCallback(async () => {
    if (!phoneCode) return

    const targetPhone = newPhone || phone
    const fullPhone = `+${callingCode}${targetPhone}`
    setPhoneVerifyState('verifying')
    setPhoneError('')

    try {
      const deviceId = await getDeviceId()
      await axios.post(
        `${API_URL}/verify/phone/verify`,
        { phone: fullPhone, code: phoneCode },
        { headers: { 'X-Device-ID': deviceId } }
      )
      setPhoneVerifyState('verified')
      setPhone(targetPhone)
      setPhoneCode('')
    } catch (error: any) {
      setPhoneError(error.response?.data?.error || 'Verification failed')
      setPhoneVerifyState('sent')
    }
  }, [phone, newPhone, callingCode, phoneCode])



  const handleSave = useCallback(async () => {
    setIsSaving(true)

    try {
      // Update username on server if changed
      if (username !== user?.username && (username || user?.username)) {
        const deviceId = await getDeviceId()
        await axios.post(
          `${API_URL}/verify/username`,
          { username: username || null },
          { headers: { 'X-Device-ID': deviceId } }
        )
      }

      // Build update object
      const updates: Record<string, any> = {
        name: name.trim() || 'Me',
        avatar,
      }

      if (username !== user?.username) {
        updates.username = username || null
      }

      if (emailVerifyState === 'verified' && email !== user?.email) {
        updates.email = email
      }

      if (phoneVerifyState === 'verified' && `+${callingCode}${phone}` !== user?.phone) {
        updates.phone = `+${callingCode}${phone}`
      }

      await updateUser.mutateAsync(updates)
      setIsEditing(false)
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }, [name, avatar, username, email, phone, callingCode, user, emailVerifyState, phoneVerifyState, updateUser, router])

  const hasChanges =
    name !== (user?.name || 'Me') ||
    avatar !== user?.avatar ||
    (username !== (user?.username || '') && usernameAvailable !== false) ||
    (emailVerifyState === 'verified' && email !== user?.email) ||
    (phoneVerifyState === 'verified' && `+${callingCode}${phone}` !== user?.phone)

  const canSave = hasChanges && !checkingUsername && usernameAvailable !== false

  // Check if user already has verified email/phone
  const hasVerifiedEmail = !!user?.email
  const hasVerifiedPhone = !!user?.phone

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
          icon={<Ionicons name={isEditing ? "close" : "arrow-back"} size={24} color={iconColorStrong} />}
        />
        <Text fontSize="$6" fontWeight="700" flex={1} color="$color">
          {isEditing ? 'Edit Profile' : 'Profile'}
        </Text>
        {isEditing ? (
          <Button
            size="$3"
            chromeless
            disabled={!canSave || isSaving}
            onPress={handleSave}
          >
            <Text color={canSave ? '$accentColor' : '$colorMuted'} fontWeight="600">
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Button>
        ) : (
          <Button
            size="$3"
            chromeless
            onPress={() => setIsEditing(true)}
          >
            <Text color="$accentColor" fontWeight="600">Edit</Text>
          </Button>
        )}
      </XStack>

      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <YStack alignItems="center" paddingVertical="$6">
          <XStack position="relative">
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
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
            )}
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
          {/* Name */}
          <YStack gap="$1" marginBottom="$4">
            <Text fontSize="$3" fontWeight="500" color="$color">Name</Text>
            {isEditing ? (
              <XStack
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                backgroundColor="$background"
              >
                <Input
                  size="$4"
                  flex={1}
                  borderWidth={0}
                  backgroundColor="transparent"
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={placeholderColor}
                />
              </XStack>
            ) : (
              <Text fontSize="$4" color="$color">{name || 'Not set'}</Text>
            )}
          </YStack>

          {/* Username */}
          <YStack gap="$1" marginBottom="$4">
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$3" fontWeight="500" color="$color">Username</Text>
              {isEditing && <Text fontSize="$2" color="$colorMuted">(optional)</Text>}
            </XStack>
            {isEditing ? (
              <>
                <XStack
                  borderWidth={1}
                  borderColor={usernameError ? '$red8' : usernameAvailable ? '$green8' : '$borderColor'}
                  borderRadius="$3"
                  backgroundColor="$background"
                  alignItems="center"
                  paddingRight="$3"
                >
                  <Input
                    size="$4"
                    flex={1}
                    borderWidth={0}
                    backgroundColor="transparent"
                    value={username}
                    onChangeText={(text) => setUsername(text.toLowerCase())}
                    placeholder="@username"
                    placeholderTextColor={placeholderColor}
                    autoCapitalize="none"
                  />
                  {checkingUsername && (
                    <Spinner size="small" />
                  )}
                  {!checkingUsername && usernameAvailable === true && (
                    <Ionicons name="checkmark-circle" size={20} color={successColor} />
                  )}
                </XStack>
                <Text fontSize="$2" color={usernameError ? '$red10' : '$colorSubtle'}>
                  {usernameError || 'Others can find you by your username'}
                </Text>
              </>
            ) : (
              <Text fontSize="$4" color={username ? '$color' : '$colorMuted'}>
                {username ? `@${username}` : 'Not set'}
              </Text>
            )}
          </YStack>

          {/* Email */}
          <YStack gap="$1" marginBottom="$4">
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$3" fontWeight="500" color="$color">Email</Text>
              {isEditing && <Text fontSize="$2" color="$colorMuted">(optional)</Text>}
              {hasVerifiedEmail && !isEditing && (
                <XStack backgroundColor="$green3" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                  <Text fontSize="$1" color="$green11">Verified</Text>
                </XStack>
              )}
            </XStack>

            {isEditing ? (
              <YStack gap="$2">
                {emailVerifyState === 'sent' || emailVerifyState === 'verifying' ? (
                  <XStack
                    borderWidth={1}
                    borderColor={emailError ? '$red8' : '$borderColor'}
                    borderRadius="$3"
                    backgroundColor="$background"
                    alignItems="center"
                    paddingRight="$3"
                  >
                    <Input
                      size="$4"
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      value={emailCode}
                      onChangeText={setEmailCode}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={placeholderColor}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    {emailVerifyState === 'verifying' ? (
                      <Spinner size="small" />
                    ) : (
                      <Text fontSize="$3" fontWeight="600" color="$accentColor" onPress={handleVerifyEmail}>
                        Verify
                      </Text>
                    )}
                  </XStack>
                ) : (
                  <XStack
                    borderWidth={1}
                    borderColor={emailError ? '$red8' : emailVerifyState === 'verified' ? '$green8' : '$borderColor'}
                    borderRadius="$3"
                    backgroundColor="$background"
                    alignItems="center"
                    paddingRight="$3"
                  >
                    <Input
                      size="$4"
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      value={newEmail}
                      onChangeText={(text) => {
                        setNewEmail(text)
                        setEmailVerifyState('idle')
                      }}
                      placeholder="Email address"
                      placeholderTextColor={placeholderColor}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {emailVerifyState === 'verified' ? (
                      <Ionicons name="checkmark-circle" size={20} color={successColor} />
                    ) : newEmail && (
                      emailVerifyState === 'sending' ? (
                        <Spinner size="small" />
                      ) : (
                        <Text fontSize="$3" fontWeight="600" color="$accentColor" onPress={handleSendEmailCode}>
                          Send code
                        </Text>
                      )
                    )}
                  </XStack>
                )}
                <Text fontSize="$2" color={emailError ? '$red10' : '$colorSubtle'}>
                  {emailError ||
                    (emailVerifyState === 'sent' && emailResendTimer > 0
                      ? `Resend code in ${emailResendTimer}s`
                      : emailVerifyState === 'sent' && emailResendTimer === 0
                        ? 'Tap to resend code'
                        : emailVerifyState === 'verified'
                          ? 'Email verified'
                          : 'Enter email and verify to save')}
                </Text>
              </YStack>
            ) : (
              <Text fontSize="$4" color={email ? '$color' : '$colorMuted'}>
                {email || 'Not set'}
              </Text>
            )}
          </YStack>

          {/* Phone */}
          <YStack gap="$1" marginBottom="$4">
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$3" fontWeight="500" color="$color">Phone</Text>
              {isEditing && <Text fontSize="$2" color="$colorMuted">(optional)</Text>}
              {hasVerifiedPhone && !isEditing && (
                <XStack backgroundColor="$green3" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                  <Text fontSize="$1" color="$green11">Verified</Text>
                </XStack>
              )}
            </XStack>

            {isEditing ? (
              <YStack gap="$2">
                {phoneVerifyState === 'sent' || phoneVerifyState === 'verifying' ? (
                  <XStack
                    borderWidth={1}
                    borderColor={phoneError ? '$red8' : '$borderColor'}
                    borderRadius="$3"
                    backgroundColor="$background"
                    alignItems="center"
                    paddingRight="$3"
                  >
                    <Input
                      size="$4"
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      value={phoneCode}
                      onChangeText={setPhoneCode}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={placeholderColor}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    {phoneVerifyState === 'verifying' ? (
                      <Spinner size="small" />
                    ) : (
                      <Text fontSize="$3" fontWeight="600" color="$accentColor" onPress={handleVerifyPhone}>
                        Verify
                      </Text>
                    )}
                  </XStack>
                ) : (
                  <XStack
                    borderWidth={1}
                    borderColor={phoneError ? '$red8' : phoneVerifyState === 'verified' ? '$green8' : '$borderColor'}
                    borderRadius="$3"
                    backgroundColor="$background"
                    alignItems="center"
                    paddingRight="$3"
                  >
                    <Text fontSize="$4" color="$color" paddingLeft="$3">
                      +{callingCode}
                    </Text>
                    <Input
                      size="$4"
                      flex={1}
                      borderWidth={0}
                      backgroundColor="transparent"
                      value={newPhone}
                      onChangeText={(text) => {
                        setNewPhone(text)
                        setPhoneVerifyState('idle')
                      }}
                      placeholder="Phone number"
                      placeholderTextColor={placeholderColor}
                      keyboardType="phone-pad"
                    />
                    {phoneVerifyState === 'verified' ? (
                      <Ionicons name="checkmark-circle" size={20} color={successColor} />
                    ) : newPhone && (
                      phoneVerifyState === 'sending' ? (
                        <Spinner size="small" />
                      ) : (
                        <Text fontSize="$3" fontWeight="600" color="$accentColor" onPress={handleSendPhoneCode}>
                          Send code
                        </Text>
                      )
                    )}
                  </XStack>
                )}
                <Text fontSize="$2" color={phoneError ? '$red10' : '$colorSubtle'}>
                  {phoneError ||
                    (phoneVerifyState === 'sent' && phoneResendTimer > 0
                      ? `Resend code in ${phoneResendTimer}s`
                      : phoneVerifyState === 'sent' && phoneResendTimer === 0
                        ? 'Tap to resend code'
                        : phoneVerifyState === 'verified'
                          ? 'Phone verified'
                          : 'Enter phone and verify to save')}
                </Text>
              </YStack>
            ) : (
              <Text fontSize="$4" color={phone ? '$color' : '$colorMuted'}>
                {phone ? `+${callingCode} ${phone}` : 'Not set'}
              </Text>
            )}
          </YStack>

          {/* Info box */}
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
                  Why verify email and phone?
                </Text>
                <Text fontSize="$2" color="$blue10" marginTop="$1">
                  Verification ensures your contact info is correct and can be used for account
                  recovery. These are optional but recommended.
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
