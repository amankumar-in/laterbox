import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { YStack } from 'tamagui'

/**
 * Catch-all for unmatched routes.
 * Primarily handles the `laterbox://dataUrl=...` deep link from
 * expo-share-intent — the useShareIntent() hook in _layout.tsx
 * processes the URL and navigates to /share automatically.
 */
export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home — the share intent hook in AppContent
    // will pick up pending share intents and navigate to /share
    router.replace('/')
  }, [router])

  // Render nothing while redirecting
  return <YStack flex={1} backgroundColor="$background" />
}
