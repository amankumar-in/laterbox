import { useCallback } from 'react'
import { ScrollView, View, Pressable } from 'react-native'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useAppTheme } from '../../contexts/ThemeContext'
import { useUser, useUpdateUser } from '../../hooks/useUser'

const MOCKUP_HEIGHT = 150
const MOCKUP_WIDTH = 88

const lightBg = '#f2f2f7'
const lightBorder = '#c6c6c8'
const darkBg = '#1c1c1e'
const darkBorder = '#38383a'

function HomeMockup({ variant }: { variant: 'light' | 'dark' | 'auto' }) {
  if (variant === 'auto') {
    return (
      <XStack width={MOCKUP_WIDTH} height={MOCKUP_HEIGHT}>
        <View
          style={{
            flex: 1,
            backgroundColor: lightBg,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            overflow: 'hidden',
            padding: 4,
          }}
        >
          <View style={{ height: 10, backgroundColor: lightBorder, borderRadius: 3, marginBottom: 3 }} />
          <View style={{ height: 14, backgroundColor: lightBorder, borderRadius: 6, marginBottom: 3, opacity: 0.7 }} />
          <XStack gap={2} marginBottom={2}>
            <View style={{ width: 20, height: 10, backgroundColor: lightBorder, borderRadius: 5, opacity: 0.8 }} />
            <View
              style={{
                width: 16,
                height: 10,
                backgroundColor: 'transparent',
                borderRadius: 5,
                borderWidth: 1,
                borderColor: lightBorder,
              }}
            />
          </XStack>
          <View style={{ height: 8, backgroundColor: lightBorder, borderRadius: 2, opacity: 0.5, marginTop: 2 }} />
          <View style={{ height: 8, backgroundColor: lightBorder, borderRadius: 2, opacity: 0.4, marginTop: 1 }} />
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: darkBg,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            overflow: 'hidden',
            padding: 4,
          }}
        >
          <View style={{ height: 10, backgroundColor: darkBorder, borderRadius: 3, marginBottom: 3 }} />
          <View style={{ height: 14, backgroundColor: darkBorder, borderRadius: 6, marginBottom: 3, opacity: 0.7 }} />
          <XStack gap={2} marginBottom={2}>
            <View style={{ width: 20, height: 10, backgroundColor: darkBorder, borderRadius: 5, opacity: 0.8 }} />
            <View
              style={{
                width: 16,
                height: 10,
                backgroundColor: 'transparent',
                borderRadius: 5,
                borderWidth: 1,
                borderColor: darkBorder,
              }}
            />
          </XStack>
          <View style={{ height: 8, backgroundColor: darkBorder, borderRadius: 2, opacity: 0.5, marginTop: 2 }} />
          <View style={{ height: 8, backgroundColor: darkBorder, borderRadius: 2, opacity: 0.4, marginTop: 1 }} />
        </View>
      </XStack>
    )
  }

  const isLight = variant === 'light'
  const bg = isLight ? lightBg : darkBg
  const bar = isLight ? lightBorder : darkBorder

  return (
    <View
      style={{
        width: MOCKUP_WIDTH,
        height: MOCKUP_HEIGHT,
        backgroundColor: bg,
        borderRadius: 8,
        padding: 4,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 10, backgroundColor: bar, borderRadius: 3, marginBottom: 3 }} />
      <View style={{ height: 14, backgroundColor: bar, borderRadius: 6, marginBottom: 3, opacity: 0.7 }} />
      <XStack gap={2} marginBottom={2}>
        <View style={{ width: 20, height: 10, backgroundColor: bar, borderRadius: 5, opacity: 0.8 }} />
        <View
          style={{ width: 16, height: 10, backgroundColor: 'transparent', borderRadius: 5, borderWidth: 1, borderColor: bar }}
        />
      </XStack>
      <View style={{ height: 8, backgroundColor: bar, borderRadius: 2, opacity: 0.5, marginTop: 2 }} />
      <View style={{ height: 8, backgroundColor: bar, borderRadius: 2, opacity: 0.4, marginTop: 1 }} />
    </View>
  )
}

type ThemeOption = 'system' | 'dark' | 'light'

const OPTIONS: { value: ThemeOption; label: string; variant: 'auto' | 'dark' | 'light' }[] = [
  { value: 'system', label: 'Auto', variant: 'auto' },
  { value: 'dark', label: 'Dark', variant: 'dark' },
  { value: 'light', label: 'Light', variant: 'light' },
]

export default function CustomizeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { iconColorStrong, accentColor } = useThemeColor()
  const { theme, setTheme } = useAppTheme()
  const { data: user } = useUser()
  const updateUser = useUpdateUser()

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleSelect = useCallback(
    (option: ThemeOption) => {
      setTheme(option)
      updateUser.mutate({
        settings: {
          ...user?.settings,
          theme: option,
        },
      })
    },
    [setTheme, updateUser, user?.settings]
  )

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
          Customize
        </Text>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$3" color="$colorSubtle">
            Choose how the app looks. Auto follows your system light/dark setting.
          </Text>

          <XStack justifyContent="space-between" alignItems="flex-end" paddingHorizontal="$2">
            {OPTIONS.map((opt) => {
              const selected = theme === opt.value
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <YStack alignItems="center" gap="$1.5">
                    <YStack
                      padding="$1"
                      borderRadius={16}
                      borderWidth={2}
                      borderColor={selected ? accentColor : '$borderColor'}
                      backgroundColor={selected ? '$blue2' : 'transparent'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <HomeMockup variant={opt.variant} />
                    </YStack>
                    <XStack alignItems="center" gap="$1">
                      <Text fontSize="$2" color={selected ? '$accentColor' : '$colorSubtle'} fontWeight={selected ? '600' : '400'}>
                        {opt.label}
                      </Text>
                      {selected && <Ionicons name="checkmark-circle" size={14} color={accentColor} />}
                    </XStack>
                  </YStack>
                </Pressable>
              )
            })}
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
