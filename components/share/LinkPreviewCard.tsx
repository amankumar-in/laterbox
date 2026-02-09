import { XStack, YStack, Text } from 'tamagui'
import { Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useLinkPreviewMode } from '../../contexts/LinkPreviewContext'
import { resolveAttachmentUri, attachmentExists } from '../../services/fileStorage'
import type { LinkPreviewMode } from '../../services/storage'

interface LinkPreviewCardProps {
  url: string
  title?: string
  description?: string
  image?: string // local relative path or remote URL
  imageUrl?: string // remote URL (fallback if no local image)
  domain?: string
  isLoading?: boolean
  mode?: LinkPreviewMode // override context mode
  onPress?: () => void
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function LinkPreviewCard({
  url,
  title,
  description,
  image,
  imageUrl,
  domain,
  isLoading = false,
  mode: modeProp,
  onPress,
}: LinkPreviewCardProps) {
  const { iconColor } = useThemeColor()
  const { linkPreviewMode: contextMode } = useLinkPreviewMode()
  const mode = modeProp ?? contextMode

  if (mode === 'off') return null

  const displayDomain = domain || extractDomain(url)

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      WebBrowser.openBrowserAsync(url)
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Pressable onPress={handlePress}>
        <YStack
          backgroundColor="$backgroundStrong"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
          overflow="hidden"
          padding="$3"
          gap="$2"
        >
          <YStack height={12} width="60%" backgroundColor="$borderColor" borderRadius="$1" />
          <YStack height={10} width="80%" backgroundColor="$borderColor" borderRadius="$1" opacity={0.6} />
          <YStack height={10} width="40%" backgroundColor="$borderColor" borderRadius="$1" opacity={0.4} />
        </YStack>
      </Pressable>
    )
  }

  // No meaningful preview data — show minimal URL card
  if (!title && !description) {
    return (
      <Pressable onPress={handlePress}>
        <XStack
          backgroundColor="$backgroundStrong"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
          paddingHorizontal="$3"
          paddingVertical="$2"
          alignItems="center"
          gap="$2"
        >
          <Ionicons name="link" size={16} color={iconColor} />
          <Text fontSize="$3" color="$accentColor" numberOfLines={1} flex={1}>
            {displayDomain}
          </Text>
        </XStack>
      </Pressable>
    )
  }

  // Resolve image URI
  const showImage = mode === 'text+image'
  let resolvedImageUri: string | undefined
  if (showImage) {
    if (image && attachmentExists(image)) {
      resolvedImageUri = resolveAttachmentUri(image)
    } else if (image && image.startsWith('http')) {
      resolvedImageUri = image
    } else if (imageUrl) {
      resolvedImageUri = imageUrl
    }
  }

  return (
    <Pressable onPress={handlePress}>
      <YStack
        backgroundColor="$backgroundStrong"
        borderRadius="$3"
        borderWidth={1}
        borderColor="$borderColor"
        overflow="hidden"
      >
        {resolvedImageUri && (
          <Image
            source={{ uri: resolvedImageUri }}
            style={{ width: '100%', height: 140 }}
            contentFit="cover"
          />
        )}
        <YStack padding="$2.5" gap="$1">
          {title && (
            <Text fontSize="$3" fontWeight="600" color="$color" numberOfLines={2}>
              {title}
            </Text>
          )}
          {description && (
            <Text fontSize="$2" color="$colorSubtle" numberOfLines={2}>
              {description}
            </Text>
          )}
          <XStack alignItems="center" gap="$1" marginTop="$0.5">
            <Ionicons name="link" size={12} color={iconColor} />
            <Text fontSize="$1" color="$colorSubtle" numberOfLines={1}>
              {displayDomain}
            </Text>
          </XStack>
        </YStack>
      </YStack>
    </Pressable>
  )
}
