import { XStack, YStack, Text } from 'tamagui'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '../../hooks/useThemeColor'
import { useLinkPreview } from '../../hooks/useLinkPreview'
import { useLinkPreviewMode } from '../../contexts/LinkPreviewContext'
import { LinkPreviewCard } from './LinkPreviewCard'
import type { ShareIntent } from 'expo-share-intent'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface SharePreviewProps {
  shareIntent: ShareIntent
}

export function SharePreview({ shareIntent }: SharePreviewProps) {
  const { iconColor } = useThemeColor()
  const { linkPreviewMode } = useLinkPreviewMode()

  // URL preview
  if (shareIntent.type === 'weburl' && shareIntent.webUrl) {
    return <UrlPreview url={shareIntent.webUrl} text={shareIntent.text} />
  }

  // Text preview
  if (shareIntent.type === 'text' && shareIntent.text) {
    return (
      <YStack
        backgroundColor="$backgroundStrong"
        borderRadius="$3"
        padding="$3"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Text fontSize="$4" color="$color" numberOfLines={8}>
          {shareIntent.text}
        </Text>
      </YStack>
    )
  }

  // Media (images/videos) preview
  if (shareIntent.type === 'media' && shareIntent.files?.length) {
    const files = shareIntent.files
    const isVideo = files[0]?.mimeType?.startsWith('video/')

    if (isVideo) {
      return (
        <YStack
          backgroundColor="$backgroundStrong"
          borderRadius="$3"
          overflow="hidden"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <XStack
            width="100%"
            height={180}
            alignItems="center"
            justifyContent="center"
            backgroundColor="$backgroundStrong"
          >
            <Image
              source={{ uri: files[0].path }}
              style={{ width: '100%', height: 180 }}
              contentFit="cover"
            />
            <XStack
              position="absolute"
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="rgba(0,0,0,0.5)"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="play" size={28} color="#fff" />
            </XStack>
          </XStack>
          {files.length > 1 && (
            <XStack padding="$2" alignItems="center" gap="$1">
              <Ionicons name="videocam" size={14} color={iconColor} />
              <Text fontSize="$2" color="$colorSubtle">{files.length} videos</Text>
            </XStack>
          )}
        </YStack>
      )
    }

    // Image grid
    return (
      <YStack gap="$2">
        <XStack flexWrap="wrap" gap="$2">
          {files.slice(0, 6).map((file, i) => (
            <Image
              key={i}
              source={{ uri: file.path }}
              style={{
                width: files.length === 1 ? '100%' : 100,
                height: files.length === 1 ? 200 : 100,
                borderRadius: 8,
              }}
              contentFit="cover"
            />
          ))}
        </XStack>
        {files.length > 6 && (
          <Text fontSize="$2" color="$colorSubtle">
            +{files.length - 6} more
          </Text>
        )}
      </YStack>
    )
  }

  // File preview
  if (shareIntent.type === 'file' && shareIntent.files?.length) {
    return (
      <YStack gap="$2">
        {shareIntent.files.map((file, i) => (
          <XStack
            key={i}
            backgroundColor="$backgroundStrong"
            borderRadius="$3"
            padding="$3"
            alignItems="center"
            gap="$3"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <XStack
              width={44}
              height={44}
              borderRadius="$2"
              backgroundColor="$accentColorMuted"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="document" size={24} color={iconColor} />
            </XStack>
            <YStack flex={1}>
              <Text fontSize="$3" fontWeight="500" color="$color" numberOfLines={1}>
                {file.fileName}
              </Text>
              {file.size != null && (
                <Text fontSize="$2" color="$colorSubtle">
                  {formatFileSize(file.size)}
                </Text>
              )}
            </YStack>
          </XStack>
        ))}
      </YStack>
    )
  }

  // Fallback
  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderRadius="$3"
      padding="$3"
      alignItems="center"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Ionicons name="share-outline" size={32} color={iconColor} />
      <Text fontSize="$3" color="$colorSubtle" marginTop="$2">
        Shared content
      </Text>
    </YStack>
  )
}

function UrlPreview({ url, text }: { url: string; text?: string | null }) {
  const { linkPreviewMode } = useLinkPreviewMode()
  const { data, isLoading } = useLinkPreview(url, linkPreviewMode)

  return (
    <YStack gap="$2">
      <LinkPreviewCard
        url={url}
        title={data?.title ?? undefined}
        description={data?.description ?? undefined}
        imageUrl={data?.imageUrl ?? undefined}
        image={data?.localImage ?? undefined}
        domain={data?.domain}
        isLoading={isLoading}
      />
      {text && text !== url && (
        <Text fontSize="$3" color="$colorSubtle" numberOfLines={3}>
          {text}
        </Text>
      )}
    </YStack>
  )
}
